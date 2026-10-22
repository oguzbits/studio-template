import { describe, expect, it } from 'vitest';

import { nextAction, setSecret, summarize } from './studio-setup-lib.mjs';

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
      [
        req,
        opt,
        { key: 'C', required: true },
        { key: 'D', required: true },
        { key: 'E', required: 'warn' },
      ],
      { A: 'skipped', B: 'skipped', C: 'failed', D: 'set', E: 'skipped' },
    );
    expect(missingRequired).toEqual(['A', 'C']);
    expect(lines).toHaveLength(5);
    expect(lines[1]).toContain('(optional)');
    expect(lines[4]).toContain('(vor Launch nötig)');
    expect(lines[4]).not.toContain('(optional)');
    expect(lines[0]).not.toContain('(');
  });
});

describe('setSecret', () => {
  it('Fehler von dotenvx enthält Key und Status, nie den Wert', () => {
    const exec = () => {
      throw Object.assign(new Error('Command failed: pnpm … geheim-wert-123'), {
        status: 3,
      });
    };
    expect(() => setSecret('K', 'geheim-wert-123', '/f', exec)).toThrow(
      'dotenvx set für K fehlgeschlagen (Exit 3)',
    );
    try {
      setSecret('K', 'geheim-wert-123', '/f', exec);
    } catch (error) {
      expect(error.message).not.toContain('geheim-wert-123');
    }
  });
});
