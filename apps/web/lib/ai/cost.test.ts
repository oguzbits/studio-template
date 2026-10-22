import { describe, expect, it } from 'vitest';

import { costEur } from './cost';

describe('costEur', () => {
  it('computes from the price table', () => {
    // haiku-5-5: 0.092 in, 0.46 out per MTok
    expect(costEur('claude-haiku-5-5', 1_000_000, 500_000)).toBeCloseTo(0.322);
  });

  it('returns null for unknown models', () => {
    expect(costEur('mystery-model', 1000, 1000)).toBeNull();
  });
});
