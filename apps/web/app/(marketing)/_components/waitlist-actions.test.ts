import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();

vi.mock('@kit/next/actions', () => ({
  enhanceAction: (fn: (p: unknown) => unknown) => fn,
}));

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ from: () => ({ upsert }) }),
}));

import { joinWaitlist } from './waitlist-actions';

const form = (email: string) => {
  const fd = new FormData();
  fd.set('email', email);
  return fd;
};

describe('joinWaitlist', () => {
  beforeEach(() => upsert.mockReset().mockResolvedValue({ error: null }));

  it('rejects an invalid email without touching the database', async () => {
    await expect(joinWaitlist(form('nope'))).resolves.toEqual({
      ok: false,
      error: 'invalid-email',
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('stores trimmed lowercase email ignoring duplicates', async () => {
    await joinWaitlist(form('  Foo@Example.COM '));

    expect(upsert).toHaveBeenCalledWith(
      { email: 'foo@example.com' },
      { onConflict: 'email', ignoreDuplicates: true },
    );
  });

  it('answers a new and a duplicate address identically', async () => {
    const first = await joinWaitlist(form('a@example.com'));
    const again = await joinWaitlist(form('a@example.com'));

    expect(again).toEqual(first);
    expect(first).toEqual({ ok: true });
  });
});
