import { describe, expect, it } from 'vitest';

import { computeMrr, isAdmin } from './metrics';

describe('isAdmin', () => {
  it('matches case-insensitively and trims entries', () => {
    expect(isAdmin('A@X.de', ' a@x.de , b@x.de ')).toBe(true);
    expect(isAdmin(' a@x.de ', 'A@x.DE')).toBe(true);
  });

  it('nobody is admin without a usable list', () => {
    expect(isAdmin('a@x.de', '')).toBe(false);
    expect(isAdmin('a@x.de', undefined)).toBe(false);
    expect(isAdmin('a@x.de', ',')).toBe(false);
    expect(isAdmin('', ',')).toBe(false);
  });

  it('rejects null email and partial matches', () => {
    expect(isAdmin(null, 'a@x.de')).toBe(false);
    expect(isAdmin(undefined, 'a@x.de')).toBe(false);
    expect(isAdmin('a@x.de', 'aa@x.de')).toBe(false);
    expect(isAdmin('aa@x.de', 'a@x.de')).toBe(false);
  });
});

describe('computeMrr', () => {
  const products = { pro: { priceMonthlyEur: 9 }, free: {} };

  it('multiplies counts by price', () => {
    expect(computeMrr({ pro: 3 }, products)).toBe(27);
  });

  it('counts products without price as 0 and ignores unknown keys', () => {
    expect(computeMrr({ pro: 1, free: 5, ghost: 9 }, products)).toBe(9);
  });
});
