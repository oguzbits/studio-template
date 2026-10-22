import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { SHARED_KEYS, checkKey, loadSharedSecrets } from './studio-tokens.mjs';

const json = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('SHARED_KEYS', () => {
  it('enthält jeden Key aus dem secrets-init-Template', () => {
    const src = readFileSync(
      new URL('./secrets-init.mjs', import.meta.url),
      'utf8',
    );
    const keys = [...src.matchAll(/^([A-Z][A-Z0-9_]+)=$/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(
        SHARED_KEYS.map((e) => e.key),
        key,
      ).toContain(key);
    }
  });
});

describe('checkKey', () => {
  it('Supabase: Org per id oder slug sichtbar', async () => {
    const fetchFn = vi.fn(async () => json(200, [{ id: 'x', slug: 'acme' }]));
    const ok = await checkKey(
      'SUPABASE_ACCESS_TOKEN',
      'tok',
      { SUPABASE_ORG_ID: 'acme' },
      fetchFn,
    );
    expect(ok.ok).toBe(true);
    const bad = await checkKey(
      'SUPABASE_ORG_ID',
      'other',
      { SUPABASE_ACCESS_TOKEN: 'tok', SUPABASE_ORG_ID: 'other' },
      fetchFn,
    );
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/acme/);
  });

  it('Supabase 401: Status im Fehler, nie der Token', async () => {
    const fetchFn = vi.fn(async () => json(401, {}));
    const r = await checkKey(
      'SUPABASE_ACCESS_TOKEN',
      'geheim-123',
      {},
      fetchFn,
    );
    expect(r.ok).toBe(false);
    expect(r.error).toContain('401');
    expect(r.error).not.toContain('geheim-123');
  });

  it('Resend: zählt verifizierte Domains, 0 warnt', async () => {
    const many = vi.fn(async () =>
      json(200, {
        data: [{ status: 'verified' }, { status: 'pending' }],
      }),
    );
    const r = await checkKey('RESEND_API_KEY', 're_x', {}, many);
    expect(r).toMatchObject({ ok: true, verifiedDomains: 1 });
    expect(r.warning).toBeUndefined();
    const none = vi.fn(async () => json(200, { data: [] }));
    const w = await checkKey('RESEND_API_KEY', 're_x', {}, none);
    expect(w.ok).toBe(true);
    expect(w.warning).toBeTruthy();
  });

  it('Resend 401: restricted_api_key ok mit Warnung, sonst Fehler', async () => {
    const restricted = vi.fn(async () =>
      json(401, { name: 'restricted_api_key' }),
    );
    const r = await checkKey('RESEND_API_KEY', 're_x', {}, restricted);
    expect(r.ok).toBe(true);
    expect(r.warning).toMatch(/Domain-Status unbekannt/);
    const other = vi.fn(async () => json(401, { name: 'invalid_api_key' }));
    expect((await checkKey('RESEND_API_KEY', 're_x', {}, other)).ok).toBe(
      false,
    );
  });

  it('Stripe live-Key: Fehler ohne Fetch', async () => {
    const fetchFn = vi.fn();
    const r = await checkKey('STRIPE_SECRET_KEY', 'sk_live_abc', {}, fetchFn);
    expect(r.ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('Netzwerkfehler: nicht erreichbar', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('boom');
    });
    expect(await checkKey('VERCEL_TOKEN', 'v', {}, fetchFn)).toEqual({
      ok: false,
      error: 'nicht erreichbar',
    });
  });

  it('Key ohne Live-Check: nur nicht leer', async () => {
    const fetchFn = vi.fn();
    expect((await checkKey('LEGAL_NAME', '', {}, fetchFn)).ok).toBe(false);
    expect((await checkKey('LEGAL_NAME', 'Foo', {}, fetchFn)).ok).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('loadSharedSecrets', () => {
  // sharedSecretsPath liest STUDIO_SECRETS_DIR/FILE zur Aufrufzeit: absoluter Pfad auf eine Dummy-Datei
  const dir = mkdtempSync(join(tmpdir(), 'secrets-'));
  writeFileSync(join(dir, 'f'), '');
  const withDummy = (fn) => {
    vi.stubEnv('STUDIO_SECRETS_DIR', dir);
    vi.stubEnv('STUDIO_SECRETS_FILE', 'f');
    try {
      fn();
    } finally {
      vi.unstubAllEnvs();
    }
  };
  it('kaputtes JSON: feste Meldung ohne Inhalt', () =>
    withDummy(() => {
      const exec = () => 'KEY=geheim-456 {nicht json';
      expect(() => loadSharedSecrets(exec)).toThrow(
        /^dotenvx get lieferte kein lesbares JSON$/,
      );
    }));
  it('exec-Fehler: feste Meldung ohne Inhalt', () =>
    withDummy(() => {
      const exec = () => {
        throw new Error('Command failed geheim-456');
      };
      expect(() => loadSharedSecrets(exec)).toThrow(
        /^dotenvx get lieferte kein lesbares JSON$/,
      );
    }));
  it('Impressum, Admin und KI warnen nur (wie env-check.ts)', () => {
    const legal = SHARED_KEYS.map((e) => e.key).filter(
      (key) => key.startsWith('LEGAL_') && key !== 'LEGAL_VAT_ID',
    );
    expect(legal).toHaveLength(6);
    for (const key of [...legal, 'ADMIN_EMAILS', 'ANTHROPIC_API_KEY']) {
      expect(SHARED_KEYS.find((e) => e.key === key).required).toBe('warn');
    }
  });
});
