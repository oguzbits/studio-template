import { describe, expect, it, vi } from 'vitest';

import { checkLive, runLocalChecks } from './studio-doctor-lib.mjs';
import { SHARED_KEYS } from './studio-tokens.mjs';

const allSecrets = () =>
  Object.fromEntries(SHARED_KEYS.map(({ key }) => [key, 'x']));
const probes = (over = {}) => ({
  node: () => '22.13.0',
  docker: () => {},
  supabaseCli: () => '2.0.0',
  secrets: allSecrets,
  ...over,
});
const okCheck = async () => ({ ok: true });
const byLabel = (results, label) => results.find((r) => r.label === label);

describe('runLocalChecks', () => {
  it('alles in Ordnung: keine Fehler', async () => {
    const results = await runLocalChecks(probes(), okCheck);
    expect(results.filter((r) => !r.ok)).toEqual([]);
  });

  it('Node unter engines ist ein harter Fehler', async () => {
    const results = await runLocalChecks(
      probes({ node: () => '20.1.0' }),
      okCheck,
    );
    expect(byLabel(results, 'Node')).toMatchObject({ ok: false, hard: true });
  });

  it('secrets() wirft: eine rote Zeile, Docker-Check läuft trotzdem', async () => {
    const docker = vi.fn();
    const results = await runLocalChecks(
      probes({
        secrets: () => {
          throw new Error('kaputt');
        },
        docker,
      }),
      okCheck,
    );
    expect(docker).toHaveBeenCalled();
    expect(byLabel(results, 'Docker').ok).toBe(true);
    const red = results.filter((r) => !r.ok);
    expect(red).toHaveLength(1);
    expect(red[0]).toMatchObject({ hard: true, label: 'Shared-Secrets' });
  });

  it('fehlender Pflicht-Key ist hart, fehlender optionaler nicht gemeldet', async () => {
    const secrets = () => ({
      ...allSecrets(),
      VERCEL_TOKEN: '',
      VERCEL_SCOPE: '',
    });
    const results = await runLocalChecks(probes({ secrets }), okCheck);
    expect(byLabel(results, 'VERCEL_TOKEN')).toMatchObject({
      ok: false,
      hard: true,
    });
    expect(byLabel(results, 'VERCEL_SCOPE')).toBeUndefined();
  });

  it('fehlender Warn-Key (Impressum) ist nur Warnung', async () => {
    const secrets = () => ({ ...allSecrets(), LEGAL_NAME: '' });
    const results = await runLocalChecks(probes({ secrets }), okCheck);
    expect(byLabel(results, 'LEGAL_NAME')).toMatchObject({
      ok: false,
      hard: false,
    });
  });

  it('Resend ohne verifizierte Domain: Warnung, kein harter Fehler', async () => {
    const checkFn = async (key) =>
      key === 'RESEND_API_KEY'
        ? {
            ok: true,
            verifiedDomains: 0,
            warning: 'Keine verifizierte Resend-Domain',
          }
        : { ok: true };
    const results = await runLocalChecks(probes(), checkFn);
    expect(byLabel(results, 'Resend-Domain')).toEqual({
      label: 'Resend-Domain',
      ok: false,
      hard: false,
      detail:
        'Mails nur an die eigene Resend-Adresse; Fremde können sich nicht registrieren. Domain anlegen (später studio:launch).',
    });
  });

  it('Resend-Key nur zum Senden: Warnung statt Domain-Hinweis', async () => {
    const checkFn = async (key) =>
      key === 'RESEND_API_KEY'
        ? { ok: true, warning: 'Domain-Status unbekannt' }
        : { ok: true };
    const results = await runLocalChecks(probes(), checkFn);
    expect(byLabel(results, 'Resend-Domain')).toEqual({
      label: 'Resend-Domain',
      ok: false,
      hard: false,
      detail: 'Domain-Status unbekannt',
    });
  });
});

describe('checkLive', () => {
  const headers = new Headers({
    'content-security-policy':
      "default-src 'self'; frame-ancestors 'none'; object-src 'none'",
  });
  const fetchWith = (health) => async (url) =>
    String(url).endsWith('/api/health')
      ? { ok: true, status: 200, json: async () => health, headers }
      : { ok: true, status: 200, headers };

  it('leere version ist rot', async () => {
    const results = await checkLive(
      'https://x.test',
      fetchWith({ ok: true, version: '' }),
    );
    expect(byLabel(results, 'Health')).toMatchObject({ ok: false, hard: true });
  });

  it('version gesetzt ist grün', async () => {
    const results = await checkLive(
      'https://x.test',
      fetchWith({ ok: true, version: 'abc' }),
    );
    expect(byLabel(results, 'Health').ok).toBe(true);
  });
});
