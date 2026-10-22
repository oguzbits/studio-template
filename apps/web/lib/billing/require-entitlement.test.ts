import { beforeEach, describe, expect, it, vi } from 'vitest';

const { row } = vi.hoisted(() => ({ row: { current: null as unknown } }));

vi.mock('~/lib/server/require-user-in-server-component', () => ({
  requireUserInServerComponent: async () => ({
    id: '00000000-0000-0000-0000-00000000000a',
  }),
}));
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: () => {
    const query = {
      from: () => query,
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: row.current, error: null }),
    };

    return query;
  },
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const { requireEntitlement } = await import('./require-entitlement');

beforeEach(() => {
  row.current = null;
});

describe('requireEntitlement', () => {
  it('no entitlement -> /pricing', async () => {
    await expect(requireEntitlement('pro')).rejects.toThrow(
      'REDIRECT /pricing',
    );
  });

  it('past_due -> /home/billing', async () => {
    row.current = { status: 'past_due', current_period_end: null };

    await expect(requireEntitlement('pro')).rejects.toThrow(
      'REDIRECT /home/billing',
    );
  });

  it('active -> returns the entitlement', async () => {
    row.current = {
      status: 'active',
      current_period_end: null,
      product_key: 'pro',
    };

    await expect(requireEntitlement('pro')).resolves.toEqual(row.current);
  });
});
