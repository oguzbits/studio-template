import { describe, expect, it } from 'vitest';

import { nextAction, summarize } from './studio-setup-lib.mjs';

const req = { key: 'A', required: true };
const opt = { key: 'B', required: false };

describe('nextAction', () => {
  it('vorhanden und ok → ok', () => {
    expect(nextAction(req, 'v', { ok: true })).toBe('ok');
  });
  it('vorhanden aber ungültig → ask', () => {
    expect(nextAction(req, 'v', { ok: false })).toBe('ask');
  });
  it('fehlt → ask', () => {
    expect(nextAction(req, undefined)).toBe('ask');
    expect(nextAction(req, '')).toBe('ask');
  });
});

describe('summarize', () => {
  it('meldet nur übersprungene/fehlgeschlagene Pflicht-Keys als fehlend', () => {
    const { missingRequired, lines } = summarize(
      [req, opt, { key: 'C', required: true }, { key: 'D', required: true }],
      { A: 'skipped', B: 'skipped', C: 'failed', D: 'set' },
    );
    expect(missingRequired).toEqual(['A', 'C']);
    expect(lines).toHaveLength(4);
  });
});
