import { beforeEach, describe, expect, it, vi } from 'vitest';

const { select, logger } = vi.hoisted(() => ({
  select: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: () => ({ select: () => ({ abortSignal: select }) }),
  }),
}));
vi.mock('@kit/shared/logger', () => ({ getLogger: async () => logger }));

const { GET } = await import('./route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/health', () => {
  it('returns 200 when the db answers', async () => {
    select.mockResolvedValue({ error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      db: 'ok',
    });
  });

  it('returns 503 without error text when the db returns an error', async () => {
    select.mockResolvedValue({
      error: { message: 'secret-detail', code: 'X' },
    });

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toMatchObject({ ok: false, db: 'down' });
    expect(text).not.toContain('secret-detail');
  });

  it('returns 503 without error text when the db call throws', async () => {
    select.mockRejectedValue(new Error('boom-detail'));

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toMatchObject({ ok: false, db: 'down' });
    expect(text).not.toContain('boom-detail');
  });
});
