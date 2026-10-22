// Gemeinsame Secrets (Shared-Datei): Key-Liste und nur lesende Live-Checks für studio:setup und studio:doctor.
// Fehlertexte enthalten nie den Wert, nur Key bzw. HTTP-Status.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { stripeKeyError } from './studio-new-lib.mjs';

const ROOT = resolve(import.meta.dirname, '../../..');

const TOKEN_URLS = {
  supabase: 'https://supabase.com/dashboard/account/tokens',
  vercel: 'https://vercel.com/account/settings/tokens',
  resend: 'https://resend.com/api-keys',
  stripe: 'https://dashboard.stripe.com/test/apikeys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
};

// required: true = studio:new braucht den Wert (fehlt → Fehler); 'warn' = Build läuft, Funktion fehlt
// (wie env-check.ts: nur Warnung); false = optional.
const entry = (key, required, secret, hint, tokenUrl) => ({
  key,
  required,
  secret,
  hint,
  ...(tokenUrl && { tokenUrl }),
});

// Reihenfolge wie das Template in secrets-init.mjs
export const SHARED_KEYS = [
  entry(
    'SUPABASE_ACCESS_TOKEN',
    true,
    true,
    'Supabase-Access-Token',
    TOKEN_URLS.supabase,
  ),
  entry('SUPABASE_ORG_ID', true, false, 'Supabase-Organisation (Slug oder ID)'),
  entry('VERCEL_TOKEN', true, true, 'Vercel-Token', TOKEN_URLS.vercel),
  entry(
    'VERCEL_SCOPE',
    false,
    false,
    'Vercel-Team-Slug, leer = persönlicher Account',
  ),
  entry('RESEND_API_KEY', true, true, 'Resend-API-Key', TOKEN_URLS.resend),
  entry(
    'STRIPE_SECRET_KEY',
    false,
    true,
    'Stripe-Testmodus-Key (sk_test_…), sonst richtet studio:new Stripe nicht ein',
    TOKEN_URLS.stripe,
  ),
  entry(
    'ANTHROPIC_API_KEY',
    'warn',
    true,
    'Anthropic-API-Key (Default-Provider)',
    TOKEN_URLS.anthropic,
  ),
  entry(
    'OPENAI_API_KEY',
    false,
    true,
    'OpenAI-API-Key (nur bei AI_PROVIDER=openai)',
    TOKEN_URLS.openai,
  ),
  entry(
    'ADMIN_EMAILS',
    'warn',
    false,
    'Komma-getrennte E-Mails mit Zugriff auf /admin',
  ),
  entry('LEGAL_NAME', 'warn', false, 'Impressum: Name des Anbieters'),
  entry('LEGAL_STREET', 'warn', false, 'Impressum: Straße und Hausnummer'),
  entry('LEGAL_ZIP_CITY', 'warn', false, 'Impressum: PLZ und Ort'),
  entry('LEGAL_EMAIL', 'warn', false, 'Impressum: Kontakt-E-Mail'),
  entry('LEGAL_PHONE', 'warn', false, 'Impressum: Telefon'),
  entry('LEGAL_VAT_ID', false, false, 'Impressum: USt-IdNr.'),
  entry(
    'LEGAL_RESPONSIBLE',
    'warn',
    false,
    'Impressum: Verantwortlich nach § 18 MStV',
  ),
];

export async function checkKey(key, value, env, fetchFn = fetch) {
  if (!value.trim()) return { ok: false, error: `${key} ist leer` };
  const get = async (url, headers) => {
    try {
      const res = await fetchFn(url, { headers });
      return { res, body: await res.json().catch(() => ({})) };
    } catch {
      return null;
    }
  };
  const bearer = { Authorization: `Bearer ${value}` };
  const unreachable = { ok: false, error: 'nicht erreichbar' };
  const byStatus = (r, service) =>
    r.res.ok
      ? { ok: true }
      : { ok: false, error: `${key}: ${service} antwortet ${r.res.status}` };

  if (key === 'SUPABASE_ACCESS_TOKEN' || key === 'SUPABASE_ORG_ID') {
    const token =
      key === 'SUPABASE_ACCESS_TOKEN' ? value : env.SUPABASE_ACCESS_TOKEN;
    const org = key === 'SUPABASE_ORG_ID' ? value : env.SUPABASE_ORG_ID;
    if (!token)
      return {
        ok: false,
        error: 'SUPABASE_ACCESS_TOKEN fehlt für die Prüfung',
      };
    const r = await get('https://api.supabase.com/v1/organizations', {
      Authorization: `Bearer ${token}`,
    });
    if (!r) return unreachable;
    if (!r.res.ok) return byStatus(r, 'Supabase');
    if (!org) return { ok: true };
    const orgs = Array.isArray(r.body) ? r.body : [];
    if (orgs.some((o) => o.id === org || o.slug === org)) return { ok: true };
    const seen = orgs.map((o) => o.slug ?? o.id).join(', ') || 'keine';
    return {
      ok: false,
      error: `SUPABASE_ORG_ID nicht sichtbar; sichtbare Orgs: ${seen}`,
    };
  }

  if (key === 'VERCEL_TOKEN') {
    const scope = env.VERCEL_SCOPE
      ? `?slug=${encodeURIComponent(env.VERCEL_SCOPE)}`
      : '';
    const r = await get(`https://api.vercel.com/v2/user${scope}`, bearer);
    return r ? byStatus(r, 'Vercel') : unreachable;
  }

  if (key === 'RESEND_API_KEY') {
    const r = await get('https://api.resend.com/domains', bearer);
    if (!r) return unreachable;
    // Send-only-Keys dürfen /domains nicht lesen, sind aber gültig
    if (r.res.status === 401 && r.body.name === 'restricted_api_key') {
      return { ok: true, warning: 'Domain-Status unbekannt' };
    }
    if (!r.res.ok) return byStatus(r, 'Resend');
    const domains = Array.isArray(r.body.data) ? r.body.data : [];
    const verifiedDomains = domains.filter(
      (d) => d.status === 'verified',
    ).length;
    return verifiedDomains
      ? { ok: true, verifiedDomains }
      : {
          ok: true,
          verifiedDomains,
          warning: 'Keine verifizierte Resend-Domain',
        };
  }

  if (key === 'STRIPE_SECRET_KEY') {
    const formatError = stripeKeyError(value);
    if (formatError) return { ok: false, error: formatError };
    const r = await get('https://api.stripe.com/v1/balance', bearer);
    return r ? byStatus(r, 'Stripe') : unreachable;
  }

  if (key === 'ANTHROPIC_API_KEY') {
    const r = await get('https://api.anthropic.com/v1/models', {
      'x-api-key': value,
      'anthropic-version': '2023-06-01',
    });
    return r ? byStatus(r, 'Anthropic') : unreachable;
  }

  if (key === 'OPENAI_API_KEY') {
    const r = await get('https://api.openai.com/v1/models', bearer);
    return r ? byStatus(r, 'OpenAI') : unreachable;
  }

  return { ok: true };
}

// gleiche Auflösung wie `with-env` in apps/web/package.json (relativ ab apps/web)
export function sharedSecretsPath() {
  return resolve(
    ROOT,
    'apps/web',
    process.env.STUDIO_SECRETS_DIR ?? '../../../studio-secrets',
    process.env.STUDIO_SECRETS_FILE ?? '.env.shared',
  );
}

export function loadSharedSecrets(exec = execFileSync) {
  const file = sharedSecretsPath();
  if (!existsSync(file)) return {};
  // Werte nur im Speicher halten, nie ausgeben: Fehlertexte von exec/JSON.parse können Inhalt enthalten
  let parsed;
  try {
    parsed = JSON.parse(
      exec('pnpm', ['--filter', 'web', 'exec', 'dotenvx', 'get', '-f', file], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    );
  } catch {
    throw new Error('dotenvx get lieferte kein lesbares JSON');
  }
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => !key.startsWith('DOTENV_')),
  );
}
