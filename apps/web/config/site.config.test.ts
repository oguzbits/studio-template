import { describe, expect, it } from 'vitest';

import siteConfig from './site.config';
import { SiteSchema } from './site.schema';

const copy = JSON.stringify(siteConfig);

describe('siteConfig', () => {
  it('contains no template placeholders', () => {
    expect(copy).not.toMatch(/makerkit|lorem|placeholder|feature (one|two)/i);
  });

  // The billing code has no trials, PayPal integration or discounts; promising them is misleading.
  it('promises nothing the billing cannot do', () => {
    expect(copy).not.toMatch(/trial|paypal|discount|money.?back/i);
  });

  it('matches the schema', () => {
    expect(() => SiteSchema.parse(siteConfig)).not.toThrow();
  });

  it('rejects an empty hero title', () => {
    const bad = { ...siteConfig, hero: { ...siteConfig.hero, title: '' } };

    expect(() => SiteSchema.parse(bad)).toThrow();
  });

  it('rejects an empty feature title', () => {
    const features = [{ title: '', description: 'x' }];

    expect(() => SiteSchema.parse({ ...siteConfig, features })).toThrow();
  });
});
