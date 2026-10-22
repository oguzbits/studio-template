// Prüflogik für `pnpm studio:doctor`. Ergebnis je Prüfung: { label, ok, hard, detail? }.
import pkg from '../../../package.json' with { type: 'json' };
import { checkHeaders } from './studio-audit-lib.mjs';
import { SHARED_KEYS, checkKey } from './studio-tokens.mjs';

const RESEND_DOMAIN_HINT =
  'Mails nur an die eigene Resend-Adresse; Fremde können sich nicht registrieren. Domain anlegen (später studio:launch).';

const MIN_NODE = pkg.engines.node.replace(/^>=/, '');
const atLeast = (have, min) => {
  const [a, b] = [have, min].map((v) =>
    v.replace(/^v/, '').split('.').map(Number),
  );
  for (let i = 0; i < 3; i++)
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return true;
};

// jede Probe isoliert: ein Fehler wird zur roten Zeile, die übrigen Prüfungen laufen weiter
async function probe(label, fn) {
  try {
    return await fn();
  } catch (error) {
    return [{ label, ok: false, hard: true, detail: error.message }];
  }
}

export async function runLocalChecks(probes, checkFn = checkKey) {
  const parts = [
    await probe('Node', () => {
      const v = probes.node();
      return [
        {
          label: 'Node',
          ok: atLeast(v, MIN_NODE),
          hard: true,
          detail: `${v} (nötig: >=${MIN_NODE})`,
        },
      ];
    }),
    await probe('Docker', () => {
      probes.docker();
      return [{ label: 'Docker', ok: true, hard: true }];
    }),
    await probe('Supabase-CLI', () => [
      {
        label: 'Supabase-CLI',
        ok: true,
        hard: true,
        detail: probes.supabaseCli(),
      },
    ]),
    await probe('Shared-Secrets', async () => {
      const secrets = probes.secrets();
      const out = [];
      for (const { key, required } of SHARED_KEYS) {
        if (!required) continue;
        // 'warn': Build läuft ohne den Wert, nur die Funktion fehlt
        const hard = required === true;
        if (!secrets[key]) {
          out.push({
            label: key,
            ok: false,
            hard,
            detail: 'fehlt (pnpm studio:setup)',
          });
          continue;
        }
        const r = await checkFn(key, secrets[key], secrets);
        out.push({ label: key, ok: r.ok, hard, detail: r.error });
        if (key === 'RESEND_API_KEY' && r.ok && r.verifiedDomains === 0) {
          out.push({
            label: 'Resend-Domain',
            ok: false,
            hard: false,
            detail: RESEND_DOMAIN_HINT,
          });
        } else if (key === 'RESEND_API_KEY' && r.ok && r.warning) {
          out.push({
            label: 'Resend-Domain',
            ok: false,
            hard: false,
            detail: r.warning,
          });
        }
      }
      return out;
    }),
  ];
  return parts.flat();
}

export async function checkLive(base, fetchFn = fetch) {
  const get = (path) => fetchFn(`${base}${path}`, { redirect: 'manual' });
  const results = await probe('Health', async () => {
    const res = await get('/api/health');
    const body = await res.json().catch(() => ({}));
    return [
      {
        label: 'Health',
        ok: res.status === 200 && Boolean(body.version),
        hard: true,
        detail: `HTTP ${res.status}, version: ${body.version || 'leer'}`,
      },
    ];
  });
  const headers = await probe('Header', async () => {
    const res = await get('/');
    return checkHeaders(Object.fromEntries(res.headers)).map((r) => ({
      label: r.id,
      ok: r.ok,
      hard: r.hard,
      detail: r.actual,
    }));
  });
  return [...results, ...headers];
}
