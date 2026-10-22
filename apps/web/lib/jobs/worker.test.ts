import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc, handlers, logger } = vi.hoisted(() => ({
  rpc: vi.fn(),
  handlers: new Map<string, (payload: unknown) => Promise<void>>(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ rpc }),
}));
vi.mock('@kit/shared/logger', () => ({ getLogger: async () => logger }));
vi.mock('./registry', () => ({ handlers }));

const { runWorker } = await import('./worker');

const now = new Date('2026-10-22T12:00:00Z');

function job(type: string, attempts: number) {
  return { id: `job-${type}-${attempts}`, type, attempts, payload: { a: 1 } };
}

function claimed(...jobs: ReturnType<typeof job>[]) {
  rpc.mockImplementation(async (name: string) =>
    name === 'claim_jobs'
      ? { data: jobs, error: null }
      : { data: null, error: null },
  );
}

function calls(name: string) {
  return rpc.mock.calls.filter(([fn]) => fn === name).map(([, args]) => args);
}

beforeEach(() => {
  vi.clearAllMocks();
  handlers.clear();
  handlers.set(
    'ok',
    vi.fn(async () => undefined),
  );
  handlers.set('boom', async () => {
    throw new Error('boom');
  });
});

describe('runWorker', () => {
  it('claims up to the limit and completes successful jobs', async () => {
    claimed(job('ok', 1));

    await expect(runWorker({ limit: 3, now })).resolves.toEqual({
      done: 1,
      failed: 0,
      retried: 0,
    });
    expect(calls('claim_jobs')).toEqual([{ p_limit: 3 }]);
    expect(handlers.get('ok')).toHaveBeenCalledWith({ a: 1 }, { now });
    expect(calls('complete_job')).toEqual([{ p_id: 'job-ok-1' }]);
    expect(calls('fail_job')).toEqual([]);
  });

  it('reschedules a failing job with exponential backoff', async () => {
    claimed(job('boom', 2));

    await expect(runWorker({ now })).resolves.toEqual({
      done: 0,
      failed: 0,
      retried: 1,
    });
    expect(calls('fail_job')).toEqual([
      {
        p_id: 'job-boom-2',
        p_error: 'boom',
        p_retry_at: new Date(now.getTime() + 120_000).toISOString(),
      },
    ]);
    expect(calls('complete_job')).toEqual([]);
  });

  it('counts the 5th failed attempt as failed', async () => {
    claimed(job('boom', 5));

    await expect(runWorker({ now })).resolves.toEqual({
      done: 0,
      failed: 1,
      retried: 0,
    });
  });

  it('treats an unknown job type as an error', async () => {
    claimed(job('nope', 1), job('constructor', 1));

    await expect(runWorker({ now })).resolves.toEqual({
      done: 0,
      failed: 0,
      retried: 2,
    });
    expect(calls('fail_job')[0]).toMatchObject({
      p_id: 'job-nope-1',
      p_error: 'Unknown job type: nope',
    });
  });

  it('keeps going after a failure and truncates long errors', async () => {
    handlers.set('long', async () => {
      throw new Error('x'.repeat(5000));
    });
    claimed(job('long', 1), job('ok', 1));

    await expect(runWorker({ now })).resolves.toEqual({
      done: 1,
      failed: 0,
      retried: 1,
    });
    expect(calls('fail_job')[0]?.p_error).toHaveLength(2000);
  });
});
