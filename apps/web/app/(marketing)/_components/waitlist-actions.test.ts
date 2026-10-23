import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();
const rateLimit = vi.fn();

vi.mock('@kit/next/actions', () => ({
  enhanceAction: (fn: (p: unknown) => unknown) => fn,
}));

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ from: () => ({ upsert }) }),
}));

vi.mock('~/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => rateLimit(...args),
}));

import { joinWaitlist } from './waitlist-actions';

const form = (email: string) => {
  const fd = new FormData();
  fd.set('email', email);
  return fd;
};

describe('joinWaitlist', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null });
    rateLimit.mockReset().mockResolvedValue(true);
  });

  it('rejects over the per-IP limit without touching the waitlist', async () => {
    rateLimit.mockResolvedValue(false);

    await expect(joinWaitlist(form('a@example.com'))).resolves.toEqual({
      ok: false,
      error: 'rate-limited',
    });
    expect(rateLimit).toHaveBeenCalledWith('waitlist', 5, 3600);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects an invalid email without touching the database', async () => {
    await expect(joinWaitlist(form('nope'))).resolves.toEqual({
      ok: false,
      error: 'invalid-email',
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects an email longer than 254 characters', async () => {
    await expect(
      joinWaitlist(
        form(
          `${'a'.repeat(60)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`,
        ),
      ),
    ).resolves.toEqual({ ok: false, error: 'invalid-email' });
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
