import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kit/shared/logger', () => ({
  getLogger: async () => ({ warn: vi.fn() }),
}));
vi.mock('next/script', () => ({ default: () => null }));

import { Analytics } from './analytics';

describe('Analytics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    for (const k of [
      'NEXT_PUBLIC_ANALYTICS_PROVIDER',
      'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
      'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
    ]) {
      vi.stubEnv(k, '');
    }
  });

  it('renders nothing when unset or off', async () => {
    expect(await Analytics()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'off');
    expect(await Analytics()).toBeNull();
  });

  it('renders nothing when the provider id is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'plausible');
    expect(await Analytics()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'umami');
    expect(await Analytics()).toBeNull();
  });

  it('renders a script for a configured provider', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'plausible');
    vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_DOMAIN', 'example.com');
    expect(await Analytics()).not.toBeNull();
  });
});
