import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runWorker, rpc, logger } = vi.hoisted(() => ({
  runWorker: vi.fn(),
  rpc: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('~/lib/jobs/worker', () => ({ runWorker }));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ rpc }),
}));
vi.mock('@kit/shared/logger', () => ({ getLogger: async () => logger }));

const { GET, POST } = await import('./route');

const result = { done: 2, failed: 0, retried: 1 };

function request(authorization?: string, query = '') {
  return new Request(`http://localhost/api/jobs/worker${query}`, {
    headers: authorization ? { authorization } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = 'cron-secret';
  runWorker.mockResolvedValue(result);
  rpc.mockResolvedValue({ data: null, error: null });
});

describe('/api/jobs/worker', () => {
  it('rejects a request without a secret', async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret of the same and of a different length', async () => {
    expect((await GET(request('Bearer cron-secreX'))).status).toBe(401);
    expect((await POST(request('Bearer nope'))).status).toBe(401);
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('fails closed without CRON_SECRET', async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request('Bearer '));

    expect(response.status).toBe(500);
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('runs the worker for the correct secret (GET and POST)', async () => {
    for (const handler of [GET, POST]) {
      const response = await handler(request('Bearer cron-secret'));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(result);
    }

    expect(runWorker).toHaveBeenCalledTimes(2);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not enqueue digests for ?daily=1 without the correct secret', async () => {
    expect((await GET(request(undefined, '?daily=1'))).status).toBe(401);
    expect((await GET(request('Bearer wrong', '?daily=1'))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(runWorker).not.toHaveBeenCalled();
  });

  it('enqueues the daily digests before running the worker with ?daily=1', async () => {
    const response = await GET(request('Bearer cron-secret', '?daily=1'));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('enqueue_daily_digests');
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(
      runWorker.mock.invocationCallOrder[0]!,
    );
  });
});
