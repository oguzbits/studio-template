import { describe, expect, it, vi } from 'vitest';

vi.mock('~/config/app.config', () => ({
  default: { name: 'Acme', title: 'Acme – tagline', description: 'desc' },
}));

const { pageMetadata } = await import('./page-metadata');

describe('pageMetadata', () => {
  it('sets canonical and og:url to the page path', () => {
    const meta = pageMetadata({ path: '/pricing', title: 'Pricing' });

    expect(meta.alternates?.canonical).toBe('/pricing');
    expect(meta.openGraph).toMatchObject({
      url: '/pricing',
      title: 'Pricing',
      siteName: 'Acme',
      description: 'desc',
    });
  });

  it('falls back to the site title and description', () => {
    const meta = pageMetadata({ path: '/' });

    expect(meta).not.toHaveProperty('title');
    expect(meta).not.toHaveProperty('description');
    expect(meta.openGraph).toMatchObject({
      title: 'Acme – tagline',
      description: 'desc',
    });
  });
});
