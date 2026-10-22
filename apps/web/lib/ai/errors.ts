import type { z } from 'zod';

export class AiProviderError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`AI provider returned ${status}: ${body.slice(0, 500)}`);
    this.name = 'AiProviderError';
  }
}

export class AiSchemaError extends Error {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super(`AI result does not match schema: ${JSON.stringify(issues)}`);
    this.name = 'AiSchemaError';
  }
}
