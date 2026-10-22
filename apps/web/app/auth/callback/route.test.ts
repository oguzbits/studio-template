import type { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redirect, exchangeCodeForSession } = vi.hoisted(() => ({
  redirect: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: () => ({ auth: { exchangeCodeForSession } }),
}));

const { GET } = await import('./route');

const call = (query: string) =>
  GET(
    new Request(`http://localhost:3000/auth/callback?${query}`) as NextRequest,
  );

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe('/auth/callback next parameter', () => {
  it('follows an internal path', async () => {
    await call('code=c&next=/home/pro');

    expect(redirect).toHaveBeenCalledWith('/home/pro');
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    'javascript:alert(1)',
    'home',
  ])('never redirects off-site for next=%s', async (next) => {
    await call(`code=c&next=${encodeURIComponent(next)}`);
    await call(`next=${encodeURIComponent(next)}`);

    expect(redirect).toHaveBeenCalledTimes(2);
    for (const [target] of redirect.mock.calls) expect(target).toBe('/home');
  });
});
