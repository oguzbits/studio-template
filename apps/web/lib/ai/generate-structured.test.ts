import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const complete = vi.hoisted(() => vi.fn());
const warn = vi.hoisted(() => vi.fn());
const db = vi.hoisted(() => ({
  cached: null as unknown,
  calls: [] as Record<string, unknown>[],
  cacheWrites: [] as Record<string, unknown>[],
}));

vi.mock('./providers/anthropic', () => ({ complete }));
vi.mock('./providers/openai-compatible', () => ({ complete }));
vi.mock('@kit/shared/logger', () => ({
  getLogger: async () => ({ warn }),
}));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: (table: string) =>
      table === 'ai_cache'
        ? {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: db.cached ? { response: db.cached } : null,
                }),
              }),
            }),
            upsert: async (row: Record<string, unknown>) => {
              db.cacheWrites.push(row);
              return { error: null };
            },
          }
        : {
            insert: async (row: Record<string, unknown>) => {
              db.calls.push(row);
              return { error: null };
            },
          },
  }),
}));

import { AiSchemaError, generateStructured } from './generate-structured';

const schema = z.object({ n: z.number() });
const ok = { text: '{"n":1}', tokensIn: 100, tokensOut: 50 };
const bad = { text: '{"n":"x"}', tokensIn: 100, tokensOut: 50 };

beforeEach(() => {
  complete.mockReset();
  warn.mockReset();
  db.cached = null;
  db.calls = [];
  db.cacheWrites = [];
});

describe('generateStructured', () => {
  it('returns cached result without calling the provider', async () => {
    db.cached = { n: 7 };

    await expect(
      generateStructured({ schema, prompt: 'p', model: 'claude-haiku-5-5' }),
    ).resolves.toEqual({ n: 7 });

    expect(complete).not.toHaveBeenCalled();
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0]).toMatchObject({
      cache_hit: true,
      tokens_in: 0,
      tokens_out: 0,
      cost_eur: 0,
    });
  });

  it('retries once after a schema failure and caches the success', async () => {
    complete.mockResolvedValueOnce(bad).mockResolvedValueOnce(ok);

    await expect(
      generateStructured({ schema, prompt: 'p', model: 'claude-haiku-5-5' }),
    ).resolves.toEqual({ n: 1 });

    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls[1]![0].prompt).toContain('invalid');
    expect(db.calls).toHaveLength(2);
    expect(db.cacheWrites).toHaveLength(1);
  });

  it('throws AiSchemaError after two failures and caches nothing', async () => {
    complete.mockResolvedValue(bad);

    const err = await generateStructured({
      schema,
      prompt: 'p',
      model: 'claude-haiku-5-5',
    }).catch((e) => e);

    expect(err).toBeInstanceOf(AiSchemaError);
    expect(err.issues.length).toBeGreaterThan(0);
    expect(complete).toHaveBeenCalledTimes(2);
    expect(db.cacheWrites).toHaveLength(0);
  });

  it('treats invalid JSON as a schema failure', async () => {
    complete.mockResolvedValue({ ...ok, text: 'nope' });

    await expect(
      generateStructured({ schema, prompt: 'p', model: 'claude-haiku-5-5' }),
    ).rejects.toBeInstanceOf(AiSchemaError);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('logs null cost and warns for an unpriced model', async () => {
    complete.mockResolvedValue(ok);

    await expect(
      generateStructured({ schema, prompt: 'p', model: 'mystery' }),
    ).resolves.toEqual({ n: 1 });

    expect(db.calls[0]).toMatchObject({ cost_eur: null, model: 'mystery' });
    expect(warn).toHaveBeenCalled();
  });
});
