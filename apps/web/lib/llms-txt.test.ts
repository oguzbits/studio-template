import { describe, expect, it } from 'vitest';

import { buildLlmsTxt } from './llms-txt';

const site = { tagline: 'Tag', description: 'Desc.', faq: [] };

describe('buildLlmsTxt', () => {
  it('starts with the name and summary and links the public pages', () => {
    const text = buildLlmsTxt('Demo', 'https://demo.test', site);

    expect(text.startsWith('# Demo\n\n> Tag. Desc.')).toBe(true);
    expect(text).toContain('[Pricing](https://demo.test/pricing)');
    expect(text).toContain('[Contact](https://demo.test/contact)');
  });

  it('lists the FAQ only when there are questions (like the sitemap)', () => {
    expect(buildLlmsTxt('Demo', 'https://demo.test', site)).not.toContain(
      '/faq',
    );
    expect(
      buildLlmsTxt('Demo', 'https://demo.test', {
        ...site,
        faq: [{ question: 'q', answer: 'a' }],
      }),
    ).toContain('[FAQ](https://demo.test/faq)');
  });
});
