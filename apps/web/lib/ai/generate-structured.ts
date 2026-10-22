import 'server-only';

import { createHash } from 'node:crypto';

import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import type { Json } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import studioConfig from '~/config/studio.config';

import { costEur } from './cost';
import { AiSchemaError } from './errors';
import * as anthropic from './providers/anthropic';
import * as openaiCompatible from './providers/openai-compatible';

export { AiProviderError, AiSchemaError } from './errors';

const providers = {
  anthropic,
  'openai-compatible': openaiCompatible,
};

type Params<S extends z.ZodType> = {
  schema: S;
  prompt: string;
  model?: string;
  system?: string;
};

export async function generateStructured<S extends z.ZodType>({
  schema,
  prompt,
  model = studioConfig.ai.defaultModel,
  system,
}: Params<S>): Promise<z.infer<S>> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const key = createHash('sha256')
    .update(
      `${model}\n${JSON.stringify(jsonSchema)}\n${system ?? ''}\n${prompt}`,
    )
    .digest('hex');
  const db = getSupabaseServerAdminClient();
  const started = Date.now();

  const { data: cached } = await db
    .from('ai_cache')
    .select('response')
    .eq('key', key)
    .maybeSingle();

  if (cached) {
    const parsed = schema.safeParse(cached.response);

    if (parsed.success) {
      await logCall({
        model,
        tokensIn: 0,
        tokensOut: 0,
        cost: 0,
        latencyMs: Date.now() - started,
        cacheHit: true,
      });

      return parsed.data;
    }
  }

  const provider = providers[studioConfig.ai.provider];
  let currentPrompt = prompt;
  let issues: z.core.$ZodIssue[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const callStarted = Date.now();
    const result = await provider.complete({
      model,
      system,
      prompt: currentPrompt,
      jsonSchema,
    });
    const cost = costEur(model, result.tokensIn, result.tokensOut);

    await logCall({
      model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      cost,
      latencyMs: Date.now() - callStarted,
      cacheHit: false,
    });

    const checked = check(schema, result.text);

    if (checked.ok) {
      const { error } = await db.from('ai_cache').upsert(
        {
          key,
          model,
          response: JSON.parse(result.text) as NonNullable<Json>,
        },
        { onConflict: 'key', ignoreDuplicates: true },
      );

      if (error) await warn({ error: error.message }, 'ai_cache write failed');

      return checked.data;
    }

    issues = checked.issues;
    currentPrompt = `${prompt}\n\nYour previous answer was invalid: ${JSON.stringify(issues)}\nReturn corrected JSON only.`;
  }

  throw new AiSchemaError(issues);

  async function logCall(row: {
    model: string;
    tokensIn: number;
    tokensOut: number;
    cost: number | null;
    latencyMs: number;
    cacheHit: boolean;
  }) {
    if (row.cost === null) {
      await warn(
        { model: row.model },
        'No price for AI model, cost_eur is null',
      );
    }

    try {
      const { error } = await db.from('ai_calls').insert({
        model: row.model,
        tokens_in: row.tokensIn,
        tokens_out: row.tokensOut,
        cost_eur: row.cost,
        latency_ms: row.latencyMs,
        cache_hit: row.cacheHit,
      });

      if (error) throw error;
    } catch (error) {
      await warn({ error: String(error) }, 'ai_calls insert failed');
    }
  }
}

function check<S extends z.ZodType>(schema: S, text: string) {
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false as const,
      issues: [
        { code: 'custom', path: [], message: 'Response is not valid JSON' },
      ] as z.core.$ZodIssue[],
    };
  }

  const parsed = schema.safeParse(json);

  return parsed.success
    ? { ok: true as const, data: parsed.data as z.infer<S> }
    : { ok: false as const, issues: parsed.error.issues };
}

async function warn(ctx: object, msg: string) {
  (await getLogger()).warn(ctx, msg);
}
