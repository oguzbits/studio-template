import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserById, rpc, from } = vi.hoisted(() => ({
  getUserById: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
vi.mock('~/lib/server/require-user-in-server-component', () => ({
  requireUserInServerComponent: async () => ({
    id: 'u1',
    email: 'admin@example.com',
  }),
}));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    auth: { admin: { getUserById } },
    rpc,
    from,
  }),
}));

const { loadAdminMetrics, loadContactMessages, requireAdmin } =
  await import('./load-metrics');

const authUser = (fields: Record<string, unknown>) => ({
  data: { user: { id: 'u1', ...fields } },
  error: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
});

describe('requireAdmin', () => {
  it('lets a confirmed admin through', async () => {
    getUserById.mockResolvedValue(
      authUser({
        email: 'admin@example.com',
        email_confirmed_at: '2026-10-01',
      }),
    );

    await expect(requireAdmin()).resolves.toMatchObject({ id: 'u1' });
  });

  it('rejects an admin address that is not confirmed', async () => {
    getUserById.mockResolvedValue(
      authUser({ email: 'admin@example.com', email_confirmed_at: null }),
    );

    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND');
  });

  it('uses the current auth email, not the one in the JWT', async () => {
    getUserById.mockResolvedValue(
      authUser({
        email: 'changed@example.com',
        email_confirmed_at: '2026-10-01',
      }),
    );

    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND');
  });

  it('rejects when the auth record cannot be loaded', async () => {
    getUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'x' },
    });

    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND');
  });
});

describe('loadAdminMetrics', () => {
  it('never queries metrics for a non-admin', async () => {
    getUserById.mockResolvedValue(
      authUser({ email: 'user@example.com', email_confirmed_at: '2026-10-01' }),
    );

    await expect(loadAdminMetrics()).rejects.toThrow('NOT_FOUND');
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('loadContactMessages', () => {
  it('never queries messages for a non-admin', async () => {
    getUserById.mockResolvedValue(
      authUser({ email: 'user@example.com', email_confirmed_at: '2026-10-01' }),
    );

    await expect(loadContactMessages(20)).rejects.toThrow('NOT_FOUND');
    expect(from).not.toHaveBeenCalled();
  });

  it('returns the newest messages up to the limit for an admin', async () => {
    getUserById.mockResolvedValue(
      authUser({
        email: 'admin@example.com',
        email_confirmed_at: '2026-10-01',
      }),
    );
    const limit = vi
      .fn()
      .mockResolvedValue({ data: [{ id: 'm1' }], error: null });
    const order = vi.fn(() => ({ limit }));

    from.mockReturnValue({ select: () => ({ order }) });

    await expect(loadContactMessages(20)).resolves.toEqual([{ id: 'm1' }]);
    expect(from).toHaveBeenCalledWith('contact_messages');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(20);
  });
});
