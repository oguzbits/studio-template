import { describe, expect, it } from 'vitest';

import { needsOnboarding } from './needs-onboarding';

describe('needsOnboarding', () => {
  it('is true when the flag is missing (existing accounts)', () => {
    expect(needsOnboarding({})).toBe(true);
    expect(needsOnboarding({ user_metadata: {} })).toBe(true);
    expect(needsOnboarding({ user_metadata: { name: 'Anna' } })).toBe(true);
  });

  it('is false once onboarded is true', () => {
    expect(needsOnboarding({ user_metadata: { onboarded: true } })).toBe(false);
  });

  it('only a real true counts', () => {
    expect(needsOnboarding({ user_metadata: { onboarded: 'true' } })).toBe(
      true,
    );
  });
});
