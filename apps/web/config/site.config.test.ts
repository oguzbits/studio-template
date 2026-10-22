import { describe, expect, it } from 'vitest';

import siteConfig from './site.config';

const copy = JSON.stringify(siteConfig);

describe('siteConfig', () => {
  it('contains no template placeholders', () => {
    expect(copy).not.toMatch(/makerkit|lorem|placeholder|feature (one|two)/i);
  });

  // The billing code has no trials, PayPal integration or discounts; promising them is misleading.
  it('promises nothing the billing cannot do', () => {
    expect(copy).not.toMatch(/trial|paypal|discount|money.?back/i);
  });
});
