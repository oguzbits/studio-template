import 'server-only';

import { AiProviderError } from '../errors';
import type { CompleteParams, CompleteResult } from './types';

export async function complete({
  model,
  system,
  prompt,
  jsonSchema,
}: CompleteParams): Promise<CompleteResult> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      // thinking tokens count against max_tokens
      max_tokens: 16000,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: jsonSchema },
      },
    }),
  });

  if (!res.ok) throw new AiProviderError(res.status, await res.text());

  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
    usage: { input_tokens: number; output_tokens: number };
  };

  return {
    text: data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join(''),
    tokensIn: data.usage.input_tokens,
    tokensOut: data.usage.output_tokens,
  };
}
