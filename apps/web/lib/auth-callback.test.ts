import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createAuthCallbackService } from '@kit/supabase/auth';

const client = (error: unknown = null) =>
  ({ auth: { verifyOtp: async () => ({ error }) } }) as never;

const verify = (qs: string) =>
  createAuthCallbackService(client()).verifyTokenHash(
    new Request(
      `https://app.example/auth/confirm?token_hash=t&type=email&${qs}`,
    ),
    { redirectPath: '/home' },
  );

describe('verifyTokenHash next/callback', () => {
  it('accepts a relative next path instead of throwing', async () => {
    const url = await verify('next=/home/pro');

    expect(url.pathname).toBe('/home/pro');
  });

  it('accepts a full callback url and uses its path', async () => {
    const url = await verify(
      `next=${encodeURIComponent('https://app.example/home/billing')}`,
    );

    expect(url.pathname).toBe('/home/billing');
  });

  it('ignores an unparsable value and uses the default path', async () => {
    const url = await verify('next=http://');

    expect(url.pathname).toBe('/home');
  });
});
