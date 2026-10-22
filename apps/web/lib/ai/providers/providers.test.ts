import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiProviderError } from '../errors';
import { complete as anthropic } from './anthropic';
import { complete as openai } from './openai-compatible';

const jsonSchema = { type: 'object', properties: { a: { type: 'string' } } };
const fetchMock = vi.fn();

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-secret');
  vi.stubEnv('OPENAI_API_KEY', 'sk-openai-secret');
  vi.stubEnv('AI_BASE_URL', 'http://localhost:11434/v1');
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('anthropic adapter', () => {
  it('sends schema as output format and reads usage', async () => {
    respond({
      content: [
        { type: 'thinking', thinking: '' },
        { type: 'text', text: '{"a":"x"}' },
      ],
      usage: { input_tokens: 11, output_tokens: 7 },
    });

    const out = await anthropic({
      model: 'claude-haiku-5-5',
      system: 'sys',
      prompt: 'hi',
      jsonSchema,
    });

    expect(out).toEqual({ text: '{"a":"x"}', tokensIn: 11, tokensOut: 7 });

    const [url, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body);

    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-ant-secret');
    expect(body.output_config.format).toEqual({
      type: 'json_schema',
      schema: jsonSchema,
    });
    expect(body.system).toBe('sys');
  });

  it('throws AiProviderError without the key', async () => {
    respond({ error: 'bad' }, 401);

    const err = await anthropic({
      model: 'm',
      prompt: 'p',
      jsonSchema,
    }).catch((e) => e);

    expect(err).toBeInstanceOf(AiProviderError);
    expect(err.status).toBe(401);
    expect(err.message).not.toContain('sk-ant-secret');
  });
});

describe('openai-compatible adapter', () => {
  it('uses AI_BASE_URL and response_format json_schema', async () => {
    respond({
      choices: [{ message: { content: '{"a":"x"}' } }],
      usage: { prompt_tokens: 5, completion_tokens: 3 },
    });

    const out = await openai({
      model: 'gpt-4o-mini',
      prompt: 'hi',
      jsonSchema,
    });

    expect(out).toEqual({ text: '{"a":"x"}', tokensIn: 5, tokensOut: 3 });

    const [url, init] = fetchMock.mock.calls[0]!;

    expect(url).toBe('http://localhost:11434/v1/chat/completions');
    expect(JSON.parse(init.body).response_format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'result', schema: jsonSchema, strict: true },
    });
  });

  it('throws AiProviderError without the key', async () => {
    respond({ error: 'nope' }, 500);

    const err = await openai({ model: 'm', prompt: 'p', jsonSchema }).catch(
      (e) => e,
    );

    expect(err).toBeInstanceOf(AiProviderError);
    expect(err.status).toBe(500);
    expect(err.message).not.toContain('sk-openai-secret');
  });
});
