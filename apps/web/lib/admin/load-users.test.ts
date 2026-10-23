import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAdmin, listUsers, from } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listUsers: vi.fn(),
  from: vi.fn(),
}));

vi.mock('./load-metrics', () => ({ requireAdmin }));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    auth: { admin: { listUsers } },
    from,
  }),
}));

const { loadAdminUsers, mergeUsers } = await import('./load-users');

const user = (id: string, fields: Record<string, unknown> = {}) => ({
  id,
  email: `${id}@example.com`,
  created_at: '2026-10-01T00:00:00Z',
  email_confirmed_at: '2026-10-01T00:00:00Z',
  ...fields,
});

const ent = (userId: string, fields: Record<string, unknown> = {}) => ({
  user_id: userId,
  product_key: 'pro',
  status: 'active' as const,
  current_period_end: null,
  updated_at: '2026-10-01T00:00:00Z',
  ...fields,
});

describe('mergeUsers', () => {
  const now = new Date('2026-10-23T00:00:00Z');

  it('has no plan or status without an entitlement', () => {
    expect(mergeUsers([user('a')], [], now)[0]).toMatchObject({
      id: 'a',
      plan: null,
      status: null,
    });
  });

  it('prefers the entitlement with access over a newer one without', () => {
    const rows = mergeUsers(
      [user('a')],
      [
        ent('a', { product_key: 'old', status: 'trialing' }),
        ent('a', {
          product_key: 'newer',
          status: 'canceled',
          updated_at: '2026-10-20T00:00:00Z',
        }),
      ],
      now,
    );

    expect(rows[0]).toMatchObject({ plan: 'old', status: 'trialing' });
  });

  it('takes the newest entitlement when none has access', () => {
    const rows = mergeUsers(
      [user('a')],
      [
        ent('a', { product_key: 'older', status: 'canceled' }),
        ent('a', {
          product_key: 'newer',
          status: 'past_due',
          updated_at: '2026-10-20T00:00:00Z',
        }),
      ],
      now,
    );

    expect(rows[0]).toMatchObject({ plan: 'newer', status: 'past_due' });
  });

  it('does not count a canceling entitlement past its period end as access', () => {
    const rows = mergeUsers(
      [user('a')],
      [
        ent('a', {
          product_key: 'ended',
          status: 'canceling',
          current_period_end: '2026-10-01T00:00:00Z',
        }),
        ent('a', {
          product_key: 'later',
          status: 'past_due',
          updated_at: '2026-10-20T00:00:00Z',
        }),
      ],
      now,
    );

    expect(rows[0]).toMatchObject({ plan: 'later' });
  });

  it('ignores entitlements of other users', () => {
    expect(mergeUsers([user('a')], [ent('b')], now)[0]?.plan).toBeNull();
  });

  it('reports emailConfirmed from email_confirmed_at', () => {
    const rows = mergeUsers(
      [user('a'), user('b', { email_confirmed_at: null, email: undefined })],
      [],
      now,
    );

    expect(rows.map((r) => r.emailConfirmed)).toEqual([true, false]);
    expect(rows[1]?.email).toBe('');
  });
});

describe('loadAdminUsers', () => {
  const entitlementQuery = (data: unknown[]) => {
    const inFn = vi.fn().mockResolvedValue({ data, error: null });

    from.mockReturnValue({ select: () => ({ in: inFn }) });

    return inFn;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: 'admin' });
  });

  it('checks the admin guard before touching any data', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'));

    await expect(loadAdminUsers(1)).rejects.toThrow('NOT_FOUND');
    expect(listUsers).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('queries entitlements only for the users of the page and merges them', async () => {
    listUsers.mockResolvedValue({
      data: { users: [user('a'), user('b')], total: 2 },
      error: null,
    });
    const inFn = entitlementQuery([ent('b', { product_key: 'pro' })]);

    const result = await loadAdminUsers(1);

    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 50 });
    expect(inFn).toHaveBeenCalledWith('user_id', ['a', 'b']);
    expect(result.rows.map((r) => [r.id, r.plan])).toEqual([
      ['a', null],
      ['b', 'pro'],
    ]);
  });

  it('treats page < 1 or NaN as page 1', async () => {
    listUsers.mockResolvedValue({ data: { users: [], total: 0 }, error: null });

    await loadAdminUsers(0);
    await loadAdminUsers(Number.NaN);

    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 50 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 1, perPage: 50 });
  });

  it('clamps an absurd page number', async () => {
    listUsers.mockResolvedValue({ data: { users: [], total: 0 }, error: null });

    await loadAdminUsers(1e15);

    expect(listUsers).toHaveBeenCalledWith({ page: 10_000, perPage: 50 });
  });

  it('sets hasMore from the total, not from a full page', async () => {
    const full = Array.from({ length: 50 }, (_, i) => user(`u${i}`));

    listUsers.mockResolvedValue({
      data: { users: full, total: 50 },
      error: null,
    });
    entitlementQuery([]);
    expect((await loadAdminUsers(1)).hasMore).toBe(false);

    listUsers.mockResolvedValue({
      data: { users: full, total: 51 },
      error: null,
    });
    expect((await loadAdminUsers(1)).hasMore).toBe(true);
  });

  it('skips the entitlement query for an empty page', async () => {
    listUsers.mockResolvedValue({ data: { users: [], total: 3 }, error: null });

    await expect(loadAdminUsers(9)).resolves.toEqual({
      rows: [],
      hasMore: false,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('throws when the listing fails', async () => {
    listUsers.mockResolvedValue({
      data: { users: [] },
      error: { message: 'x' },
    });

    await expect(loadAdminUsers(1)).rejects.toThrow('listUsers failed');
  });
});
