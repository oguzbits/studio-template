import { describe, expect, it } from 'vitest';

import { resolveLegal } from './legal';

const full = {
  LEGAL_NAME: 'Max Muster',
  LEGAL_STREET: 'Weg 1',
  LEGAL_ZIP_CITY: '10115 Berlin',
  LEGAL_EMAIL: 'max@example.com',
  LEGAL_PHONE: '+49 30 1234',
  LEGAL_RESPONSIBLE: 'Max Muster',
};

describe('resolveLegal', () => {
  it('maps values and leaves the optional VAT id empty', () => {
    const { legal, missing } = resolveLegal(full);

    expect(missing).toEqual([]);
    expect(legal.name).toBe('Max Muster');
    expect(legal.vatId).toBeUndefined();
  });

  it('uses a visible placeholder for each missing or blank required value', () => {
    const { legal, missing } = resolveLegal({ ...full, LEGAL_NAME: '  ' });

    expect(legal.name).toBe('[LEGAL_NAME fehlt]');
    expect(missing).toEqual(['LEGAL_NAME']);
  });

  it('passes the VAT id through when set', () => {
    expect(resolveLegal({ ...full, LEGAL_VAT_ID: 'DE123' }).legal.vatId).toBe(
      'DE123',
    );
  });
});
