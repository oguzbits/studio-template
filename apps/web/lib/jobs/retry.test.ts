import { describe, expect, it } from 'vitest';

import { retryDelayMs } from './retry';

describe('retryDelayMs', () => {
  it('doubles the delay per attempt, starting at one minute', () => {
    expect(retryDelayMs(1)).toBe(60_000);
    expect(retryDelayMs(2)).toBe(120_000);
    expect(retryDelayMs(4)).toBe(480_000);
  });
});
