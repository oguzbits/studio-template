import { describe, expect, it } from 'vitest';

import { highlightedProduct } from './highlighted-product';

describe('highlightedProduct', () => {
  it('prefers the first subscription', () => {
    expect(
      highlightedProduct({
        a: { mode: 'payment' },
        b: { mode: 'subscription' },
      }),
    ).toBe('b');
  });

  it('falls back to the first product', () => {
    expect(highlightedProduct({ a: { mode: 'payment' } })).toBe('a');
  });

  it('returns null without products', () => {
    expect(highlightedProduct({})).toBeNull();
  });
});
