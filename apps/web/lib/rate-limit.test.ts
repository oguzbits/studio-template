import { createHash } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-real-ip': '9.9.9.9' }),
}));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ rpc }),
}));

import { rateLimit, rateLimitKey } from './rate-limit';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('rateLimitKey', () => {
  it('prefers x-real-ip over a spoofable x-forwarded-for', () => {
    const key = rateLimitKey(
      'waitlist',
      new Headers({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' }),
    );

    expect(key).toBe(`waitlist:${sha('9.9.9.9')}`);
  });

  it('falls back to the first x-forwarded-for entry, then unknown', () => {
    expect(
      rateLimitKey('w', new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })),
    ).toBe(`w:${sha('1.2.3.4')}`);
    expect(rateLimitKey('w', new Headers())).toBe(`w:${sha('unknown')}`);
  });

  it('groups IPv6 addresses by /64 and keeps IPv4 as is', () => {
    const key = (ip: string) =>
      rateLimitKey('w', new Headers({ 'x-real-ip': ip }));

    expect(key('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe(
      key('2001:DB8:1:2::1'),
    );
    expect(key('2001:db8:1:2::1')).toBe(key('2001:db8:1:2:0:0:0:ffff'));
    expect(key('2001:db8:1:3::1')).not.toBe(key('2001:db8:1:2::1'));
    expect(key('::1')).toBe(key('0:0:0:0:5::9'));
    expect(key('::ffff:1.2.3.4')).toBe(`w:${sha('1.2.3.4')}`);
    expect(key('1.2.3.4')).toBe(`w:${sha('1.2.3.4')}`);
  });

  it('never contains the plain IP', () => {
    const key = rateLimitKey('w', new Headers({ 'x-real-ip': '9.9.9.9' }));

    expect(key).not.toContain('9.9.9.9');
  });
});

describe('rateLimit', () => {
  beforeEach(() => rpc.mockReset());

  it('passes the hashed key and limits to check_rate_limit', async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(rateLimit('waitlist', 5, 3600)).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_key: `waitlist:${sha('9.9.9.9')}`,
      p_max: 5,
      p_window_seconds: 3600,
    });
  });

  it('fails open when the database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });

    await expect(rateLimit('waitlist', 5, 3600)).resolves.toBe(true);
    expect(console.error).toHaveBeenCalled();
  });
});
