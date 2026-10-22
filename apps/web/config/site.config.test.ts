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

  // a highlight that is not part of the title would render nothing
  it('rejects a highlight that is not part of the title', () => {
    const hero = { ...siteConfig.hero, highlight: 'not in the title' };

    expect(() => SiteSchema.parse({ ...siteConfig, hero })).toThrow();
  });

  it('accepts a highlight that is part of the title', () => {
    const hero = {
      ...siteConfig.hero,
      highlight: siteConfig.hero.title.slice(-4),
    };

    expect(() => SiteSchema.parse({ ...siteConfig, hero })).not.toThrow();
  });
});
