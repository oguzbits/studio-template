import 'server-only';

import { AiProviderError } from '../errors';
import type { CompleteParams, CompleteResult } from './types';

// shortcut: strict mode needs additionalProperties:false and every property required;
// zod objects satisfy the first, so avoid .optional() in schemas used with strict-only servers.
export async function complete({
  model,
  system,
  prompt,
  jsonSchema,
}: CompleteParams): Promise<CompleteResult> {
  const baseUrl = (
    process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  ).replace(/\/+$/, '');
  const key = process.env.OPENAI_API_KEY;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key ? { authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'result', schema: jsonSchema, strict: true },
      },
    }),
  });

  if (!res.ok) throw new AiProviderError(res.status, await res.text());

  const data = (await res.json()) as {
    choices: { message: { content: string | null } }[];
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices[0]?.message.content ?? '',
    tokensIn: data.usage.prompt_tokens,
    tokensOut: data.usage.completion_tokens,
  };
}
