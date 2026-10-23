import { describe, expect, it } from 'vitest';

import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it('keeps same-origin paths', () => {
    expect(safeRedirect('/home/pro', '/home')).toBe('/home/pro');
  });

  it.each([
    undefined,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('falls back for %s', (value) => {
    expect(safeRedirect(value, '/home')).toBe('/home');
  });
});
