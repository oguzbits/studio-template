// `pnpm studio:new <name> [--dry-run]`: neues Projekt aus diesem Template anlegen und live schalten.
// Ablauf: Kopie → Supabase (EU) → Migrationen → Vercel-Projekt → Stripe (Test) → Env → Deploy → echte URL prüfen → Auth/SMTP/Vault → Checkliste.
// Wiederholbar: Der Zustand liegt in <ziel>/.studio/state.json; erledigte Schritte werden übersprungen.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

import billing from '../../../apps/web/config/billing.json' with { type: 'json' };
import {
  buildChecklist,
  formEncode,
  portBase,
  priceBody,
  stripeKeyError,
  rewritePorts,
  sqlLiteral,
  validateName,
} from './studio-new-lib.mjs';

const VERCEL_CLI = 'vercel@62.7.0';
const REGION = 'eu-central-1';
const ROOT = resolve(import.meta.dirname, '../../..');

const args = process.argv.slice(2);
const name = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');

const nameError = validateName(name);
if (nameError) fail(nameError);

const target = resolve(ROOT, '..', name);
const web = resolve(target, 'apps/web');
const stateFile = resolve(target, '.studio/state.json');
const timings = [];
const startedAt = Date.now();

const env = { ...loadSharedSecrets(), ...process.env };
for (const key of [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_ORG_ID',
  'VERCEL_TOKEN',
  // ohne Key bricht erst der erste Vercel-Build ab (env-check), nach Supabase- und Vercel-Anlage
  'RESEND_API_KEY',
]) {
  if (!env[key])
    fail(
      `${key} fehlt (in ${sharedSecretsPath()} oder als Shell-Variable setzen).`,
    );
}

if (existsSync(target) && !existsSync(stateFile)) {
  fail(
    `${target} existiert bereits ohne .studio/state.json (abgebrochene Kopie?). Ordner prüfen und entfernen.`,
  );
}

const state = existsSync(stateFile)
  ? JSON.parse(readFileSync(stateFile, 'utf8'))
  : {};

try {
  await preflight();
} catch (error) {
  fail(error.message);
}

if (dryRun) {
  console.log(
    `Dry run: würde ${target} anlegen, Supabase-Projekt „${name}“ in ${REGION}, Vercel-Projekt „${name}“ (Root apps/web), Ports ab ${portBase(name)}.`,
  );
  console.log(
    env.STRIPE_SECRET_KEY
      ? `Stripe: ${stripeKeyError(env.STRIPE_SECRET_KEY) ?? 'Testkey gefunden, Produkte/Preise/Webhook/Portal werden angelegt.'}`
      : 'Stripe: kein STRIPE_SECRET_KEY in den Shared Secrets, Schritt wird übersprungen.',
  );
  process.exit(0);
}

const save = () => {
  mkdirSync(resolve(target, '.studio'), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  chmodSync(stateFile, 0o600);
};

try {
  await step('Template kopieren', copyTemplate, () => state.copied);
  await step(
    'Supabase-Projekt anlegen',
    createSupabaseProject,
    () => state.supabaseRef,
  );
  await step('Supabase bereit', waitForSupabase, () => state.supabaseHealthy);
  await step('Migrationen pushen', pushMigrations, () => state.migrated);
  await step(
    'Vercel-Projekt anlegen',
    createVercelProject,
    () => state.siteUrl,
  );
  await step(
    'Stripe einrichten (Testmodus)',
    configureStripe,
    () => state.stripeConfigured,
  );
  await step('Env-Variablen setzen', setVercelEnv, () => state.envSet);
  await step('.env.local schreiben', writeLocalEnv, () => state.localEnv);
  await step('Deploy (Produktion)', deploy, () => state.deployed);
  // Auth-URLs und Vault erst mit der echten Domain, sonst ruft pg_cron eine fremde App mit CRON_SECRET auf
  await step(
    'Produktions-URL prüfen',
    verifySiteUrl,
    () => state.siteUrlVerified,
  );
  await step(
    'Supabase Auth, SMTP, Vault',
    configureSupabase,
    () => state.supabaseConfigured,
  );
  await step('Live-Check /api/health', waitForHealth, () => state.live);
} catch (error) {
  console.error(
    `\n✗ ${error.message}\nErneut ausführen setzt beim fehlgeschlagenen Schritt fort: pnpm studio:new ${name}`,
  );
  process.exit(1);
}

const checklist = buildChecklist({
  name,
  siteUrl: state.siteUrl,
  supabaseRef: state.supabaseRef,
  smtpConfigured: Boolean(env.RESEND_API_KEY),
  stripeConfigured: Boolean(state.stripeConfigured),
});
mkdirSync(resolve(target, 'docs'), { recursive: true });
writeFileSync(
  resolve(target, 'docs/launch-checklist.md'),
  `# Launch-Checkliste ${name}\n\n${checklist}\n`,
);
git(['add', 'docs/launch-checklist.md']);
// erneuter Lauf nach Erfolg: nichts zu committen
if (git(['status', '--porcelain', 'docs/launch-checklist.md']).trim()) {
  git(['commit', '-q', '-m', 'docs: launch checklist from studio:new']);
}

console.log(`\n${checklist}\n`);
console.log('Zeiten:');
for (const [label, ms] of timings)
  console.log(`  ${label.padEnd(28)} ${(ms / 1000).toFixed(0)} s`);
console.log(
  `  ${'Gesamt (live)'.padEnd(28)} ${((Date.now() - startedAt) / 60000).toFixed(1)} min`,
);
console.log(`\nLive: ${state.siteUrl}\nProjekt: ${target}`);
if (!env.STRIPE_SECRET_KEY) {
  console.log(
    'Stripe übersprungen (kein STRIPE_SECRET_KEY in den Shared Secrets): Schritte stehen in der Checkliste.',
  );
}

// Schnell-Audit (ohne Lighthouse) als Rückmeldung, nicht fatal; voll: pnpm studio:audit <url>
try {
  run(
    'node',
    [
      resolve(ROOT, 'tooling/scripts/src/studio-audit.mjs'),
      state.siteUrl,
      '--no-lighthouse',
    ],
    {
      cwd: target,
    },
  );
} catch {
  console.log('Audit meldet offene Punkte (siehe oben).');
}

// --- Schritte ---------------------------------------------------------------

// Nur lesend: Tokens und Org/Scope prüfen, bevor irgendetwas angelegt wird.
async function preflight() {
  const orgs = await supabaseApi('GET', '/v1/organizations').catch((error) => {
    throw new Error(
      `SUPABASE_ACCESS_TOKEN abgelehnt (${error.status}). Token mit Zugriff auf die Organisation anlegen.`,
    );
  });
  const org = env.SUPABASE_ORG_ID;
  if (!orgs.some((o) => o.id === org || o.slug === org)) {
    const visible = orgs.map((o) => `${o.slug ?? o.id} (${o.name})`).join(', ');
    throw new Error(
      `SUPABASE_ORG_ID „${org}“ ist für den Token nicht sichtbar. Sichtbar: ${visible || 'keine – Token hat keine Org-Rechte'}.`,
    );
  }
  // `projects create` liest die Org-Details; Org-Liste allein reicht nicht
  await supabaseApi('GET', `/v1/organizations/${org}`).catch((error) => {
    throw new Error(
      `SUPABASE_ACCESS_TOKEN darf die Organisation nicht lesen (${error.status}). Token-Rechte: Organisation lesen + Projekte anlegen/verwalten.`,
    );
  });
  await vercelApi('GET', '/v9/projects?limit=1').catch((error) => {
    throw new Error(
      `VERCEL_TOKEN/VERCEL_SCOPE abgelehnt (${error.status}): ${error.message}`,
    );
  });
  if (env.STRIPE_SECRET_KEY) {
    const keyError = stripeKeyError(env.STRIPE_SECRET_KEY);
    if (keyError) throw new Error(keyError);
    await stripeApi('GET', '/v1/products?limit=1').catch((error) => {
      throw new Error(`STRIPE_SECRET_KEY abgelehnt (${error.status}).`);
    });
  }
  console.log(
    `✓ Tokens geprüft (Supabase-Org, Vercel${env.STRIPE_SECRET_KEY ? ', Stripe' : ''} erreichbar)`,
  );
}

async function copyTemplate() {
  if (
    execFileSync('git', ['-C', ROOT, 'status', '--porcelain'], {
      encoding: 'utf8',
    }).trim()
  ) {
    throw new Error(
      'Template hat uncommittete Änderungen; git archive kopiert nur HEAD. Erst committen.',
    );
  }
  const sha = execFileSync(
    'git',
    ['-C', ROOT, 'rev-parse', '--short', 'HEAD'],
    { encoding: 'utf8' },
  ).trim();
  // abgebrochene Kopie (nur state.json, copied fehlt): neu beginnen
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  save();
  execFileSync('sh', [
    '-c',
    'git -C "$1" archive HEAD | tar -x -C "$2"',
    'sh',
    ROOT,
    target,
  ]);
  for (const path of [
    'docs/superpowers',
    'docs/ledger.md',
    'docs/dummy-run.md',
  ]) {
    rmSync(resolve(target, path), { recursive: true, force: true });
  }

  const base = portBase(name);
  for (const path of [
    'apps/web/supabase/config.toml',
    'apps/web/.env.development',
    'apps/web/.env.test',
    'apps/e2e/tests/utils/mailbox.ts',
  ]) {
    const file = resolve(target, path);
    writeFileSync(file, rewritePorts(readFileSync(file, 'utf8'), base));
  }
  const config = resolve(web, 'supabase/config.toml');
  writeFileSync(
    config,
    readFileSync(config, 'utf8').replace(
      /^project_id = .*$/m,
      `project_id = "${name}"`,
    ),
  );
  writeFileSync(
    resolve(target, '.gitignore'),
    `${readFileSync(resolve(target, '.gitignore'), 'utf8')}\n# studio:new state\n.studio\n`,
  );
  // `vercel deploy` lädt das Verzeichnis hoch und liest .gitignore nicht: Secrets ausschließen
  writeFileSync(
    resolve(target, '.vercelignore'),
    '.studio\n.env*.local\n.env.keys\n',
  );

  git(['init', '-q', '-b', 'main']);
  run('pnpm', ['install'], { cwd: target });
  git(['add', '-A']);
  git([
    'commit',
    '-q',
    '-m',
    `chore: init ${name} from studio-template ${sha}`,
  ]);
  state.copied = true;
  state.portBase = base;
  save();
}

async function createSupabaseProject() {
  // Management API statt `supabase projects create`: die CLI scheitert mit Org-scoped Tokens
  // („Failed to retrieve organization“), die API nicht; Passwort zudem nicht in `ps` sichtbar.
  const projects = await supabaseApi('GET', '/v1/projects');
  const existing = projects.find(
    (project) =>
      project.name === name &&
      [project.organization_id, project.organization_slug].includes(
        env.SUPABASE_ORG_ID,
      ),
  );
  state.dbPassword ??= randomBytes(24).toString('base64url');
  save();
  const project =
    existing ??
    // organization_id/region sind deprecated; mit Org-Tokens scheitert organization_id (500)
    (await supabaseApi('POST', '/v1/projects', {
      name,
      organization_slug: env.SUPABASE_ORG_ID,
      region_selection: { type: 'specific', code: REGION },
      db_pass: state.dbPassword,
    }));
  state.supabaseRef = project.ref ?? project.id;
  if (!state.supabaseRef) throw new Error('Supabase-Antwort ohne Projekt-Ref.');
  save();
}

async function waitForSupabase() {
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    const project = await supabaseApi(
      'GET',
      `/v1/projects/${state.supabaseRef}`,
    );
    if (project.status === 'ACTIVE_HEALTHY') {
      state.supabaseHealthy = true;
      save();
      return;
    }
    await sleep(10_000);
  }
  throw new Error('Supabase-Projekt ist nach 10 Minuten nicht bereit.');
}

// ACTIVE_HEALTHY kommt vor den Storage-Tabellen; die erste Migration legt einen Bucket an
async function waitForStorage() {
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    const [row] = await supabaseApi(
      'POST',
      `/v1/projects/${state.supabaseRef}/database/query`,
      { query: "select to_regclass('storage.buckets') is not null as ready" },
    );
    if (row?.ready) return;
    await sleep(15_000);
  }
  throw new Error('Supabase Storage ist nach 15 Minuten nicht bereit.');
}

async function pushMigrations() {
  // Passwort per Env statt Argument (nicht in `ps` sichtbar)
  const dbEnv = { SUPABASE_DB_PASSWORD: state.dbPassword };
  await waitForStorage();
  supabase(['link', '--project-ref', state.supabaseRef], dbEnv);
  supabase(['db', 'push', '--linked', '--include-all'], dbEnv, 'y\n');
  const keys = await supabaseApi(
    'GET',
    `/v1/projects/${state.supabaseRef}/api-keys`,
  );
  state.anonKey = keys.find((key) => key.name === 'anon')?.api_key;
  state.serviceRoleKey = keys.find(
    (key) => key.name === 'service_role',
  )?.api_key;
  if (!state.anonKey || !state.serviceRoleKey)
    throw new Error('anon/service_role-Key nicht gefunden.');
  state.migrated = true;
  save();
}

async function createVercelProject() {
  const created = await vercelApi('POST', '/v11/projects', {
    name,
    framework: 'nextjs',
    rootDirectory: 'apps/web',
  }).catch((error) => {
    if (error.status === 409) return vercelApi('GET', `/v9/projects/${name}`);
    throw error;
  });
  const { domains = [] } = await vercelApi(
    'GET',
    `/v9/projects/${created.id}/domains`,
  );
  const domain =
    domains.find((d) => d.name.endsWith('.vercel.app'))?.name ??
    `${name}.vercel.app`;
  state.vercelProjectId = created.id;
  state.siteUrl = `https://${domain}`;
  state.cronSecret ??= randomBytes(32).toString('hex');
  save();
}

async function setVercelEnv() {
  const values = {
    NEXT_PUBLIC_SITE_URL: state.siteUrl,
    NEXT_PUBLIC_PRODUCT_NAME: name,
    NEXT_PUBLIC_SUPABASE_URL: `https://${state.supabaseRef}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: state.anonKey,
    SUPABASE_SERVICE_ROLE_KEY: state.serviceRoleKey,
    CRON_SECRET: state.cronSecret,
    // ohne verifizierte Resend-Domain der einzige erlaubte Absender; EMAIL_FROM aus den Secrets gewinnt
    EMAIL_FROM: `${name} <onboarding@resend.dev>`,
    // pnpm-Version aus packageManager verwenden
    ENABLE_EXPERIMENTAL_COREPACK: '1',
    // Google-Button nur, wenn der Provider in Supabase Auth aktiviert wird (configureSupabase)
    NEXT_PUBLIC_AUTH_GOOGLE: String(
      Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    ),
  };
  if (state.stripeConfigured)
    Object.assign(values, stripeEnv(), {
      STRIPE_WEBHOOK_SECRET: state.stripeWebhookSecret,
    });
  for (const key of Object.keys(env)) {
    if (
      /^(RESEND_API_KEY|EMAIL_FROM|ANTHROPIC_API_KEY|OPENAI_API_KEY|AI_PROVIDER|AI_MODEL|AI_BASE_URL|ADMIN_EMAILS|SENTRY_DSN|NEXT_PUBLIC_SENTRY_DSN|LEGAL_\w+|NEXT_PUBLIC_ANALYTICS_\w+|NEXT_PUBLIC_PLAUSIBLE_\w+|NEXT_PUBLIC_UMAMI_\w+)$/.test(
        key,
      ) &&
      env[key]
    ) {
      values[key] = env[key];
    }
  }
  await vercelApi(
    'POST',
    `/v10/projects/${state.vercelProjectId}/env?upsert=true`,
    Object.entries(values).map(([key, value]) => ({
      key,
      value,
      type:
        key.startsWith('NEXT_PUBLIC_') || key === 'ENABLE_EXPERIMENTAL_COREPACK'
          ? 'plain'
          : 'encrypted',
      target: ['production'],
    })),
  );
  state.envSet = true;
  save();
}

// Vor dem ersten Deploy ist die Domain nur geraten (`<name>.vercel.app` kann vergeben sein).
async function verifySiteUrl() {
  const { domains = [] } = await vercelApi(
    'GET',
    `/v9/projects/${state.vercelProjectId}/domains`,
  );
  const domain = domains
    .map((d) => d.name)
    .filter((d) => d.endsWith('.vercel.app'))
    .sort((a, b) => a.length - b.length)[0];
  if (!domain) throw new Error('Vercel meldet keine Produktions-Domain.');

  const actual = `https://${domain}`;
  if (actual !== state.siteUrl) {
    console.log(
      `  Vercel hat ${actual} vergeben (geraten war ${state.siteUrl}): Env aktualisieren, neu deployen.`,
    );
    state.siteUrl = actual;
    // Merker überlebt einen Abbruch: sonst sähe der nächste Lauf actual === siteUrl und überspränge das Update
    state.siteUrlStale = true;
    save();
  }
  if (state.siteUrlStale) {
    if (state.stripeConfigured) await updateStripeUrls();
    await setVercelEnv();
    await deploy();
    state.siteUrlStale = false;
  }
  state.siteUrlVerified = true;
  save();
}

async function configureSupabase() {
  const auth = {
    site_url: state.siteUrl,
    uri_allow_list: `${state.siteUrl}/**`,
  };
  // Kit-Templates verlinken /auth/confirm (token_hash, jeder Browser); die Supabase-Defaults brauchen den PKCE-Cookie des Sign-up-Browsers
  const templates = {
    confirmation: ['confirm-email', 'Confirm your email'],
    magic_link: ['magic-link', `Sign in to ${name}`],
    recovery: ['reset-password', 'Reset your password'],
    email_change: ['change-email-address', 'Confirm your email change'],
    invite: ['invite-user', `You are invited to ${name}`],
  };
  for (const [key, [file, subject]] of Object.entries(templates)) {
    auth[`mailer_subjects_${key}`] = subject;
    auth[`mailer_templates_${key}_content`] = readFileSync(
      resolve(web, 'supabase/templates', `${file}.html`),
      'utf8',
    ).replaceAll('Studio', name); // Platzhalter-Produktname in den Templates
  }
  if (env.RESEND_API_KEY) {
    // ohne verifizierte Domain kann Resend nur von onboarding@resend.dev senden
    const sender =
      env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ??
      env.EMAIL_FROM ??
      'onboarding@resend.dev';
    Object.assign(auth, {
      smtp_host: 'smtp.resend.com',
      smtp_port: '465',
      smtp_user: 'resend',
      smtp_pass: env.RESEND_API_KEY,
      smtp_admin_email: sender,
      smtp_sender_name: name,
    });
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    Object.assign(auth, {
      external_google_enabled: true,
      external_google_client_id: env.GOOGLE_CLIENT_ID,
      external_google_secret: env.GOOGLE_CLIENT_SECRET,
    });
  }
  await supabaseApi(
    'PATCH',
    `/v1/projects/${state.supabaseRef}/config/auth`,
    auth,
  );

  const upsertSecret = (secretName, value) => `
    if exists (select 1 from vault.secrets where name = ${sqlLiteral(secretName)}) then
      perform vault.update_secret((select id from vault.secrets where name = ${sqlLiteral(secretName)}), ${sqlLiteral(value)});
    else
      perform vault.create_secret(${sqlLiteral(value)}, ${sqlLiteral(secretName)});
    end if;`;
  await supabaseApi(
    'POST',
    `/v1/projects/${state.supabaseRef}/database/query`,
    {
      query: `do $studio$ begin ${upsertSecret('worker_url', `${state.siteUrl}/api/jobs/worker`)} ${upsertSecret('cron_secret', state.cronSecret)} end $studio$;`,
    },
  );
  state.supabaseConfigured = true;
  save();
}

// Ein Stripe-Konto für alle Projekte: alles trägt `studio_project`, Produkt-IDs sind `<projekt>_<key>`.
async function configureStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    console.log('  übersprungen: kein STRIPE_SECRET_KEY in den Shared Secrets');
    return;
  }
  for (const [key, product] of Object.entries(billing.products)) {
    const id = `${name}_${key}`;
    await stripeApi('GET', `/v1/products/${id}`).catch(async (error) => {
      if (error.status !== 404) throw error;
      await stripeApi('POST', '/v1/products', {
        id,
        name: `${name} ${product.name}`,
        metadata: { studio_project: name, studio_product: key },
      });
    });
    const body = priceBody(name, key, id, product);
    const { data } = await stripeApi(
      'GET',
      `/v1/prices?active=true&lookup_keys[0]=${encodeURIComponent(body.lookup_key)}`,
    );
    const price = data[0] ?? (await stripeApi('POST', '/v1/prices', body));
    state.stripePrices = { ...state.stripePrices, [key]: price.id };
  }

  // Das Signing-Secret gibt Stripe nur bei der Anlage zurück: ohne Secret im State neu anlegen.
  if (!state.stripeWebhookSecret) {
    const { data } = await stripeApi('GET', '/v1/webhook_endpoints?limit=100');
    for (const endpoint of data.filter(
      (e) => e.metadata?.studio_project === name,
    )) {
      await stripeApi('DELETE', `/v1/webhook_endpoints/${endpoint.id}`);
    }
    const endpoint = await stripeApi('POST', '/v1/webhook_endpoints', {
      url: `${state.siteUrl}/api/billing/webhook`,
      enabled_events: billing.webhookEvents,
      // Payload-Version der App-SDK, nicht der Konto-Default
      api_version: stripeSdkApiVersion(),
      description: `studio:new ${name}`,
      metadata: { studio_project: name },
    });
    state.stripeWebhookId = endpoint.id;
    state.stripeWebhookSecret = endpoint.secret;
    save();
  }

  if (!state.stripePortalConfig) {
    const { data } = await stripeApi(
      'GET',
      '/v1/billing_portal/configurations?limit=100',
    );
    const existing = data.find((c) => c.metadata?.studio_project === name);
    state.stripePortalConfig =
      existing?.id ??
      (
        await stripeApi('POST', '/v1/billing_portal/configurations', {
          ...portalUrls(),
          features: {
            customer_update: {
              enabled: true,
              allowed_updates: ['email', 'address'],
            },
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            subscription_cancel: { enabled: true, mode: 'at_period_end' },
          },
          metadata: { studio_project: name },
        })
      ).id;
  }

  state.stripeConfigured = true;
  // Nachträglich (Key erst nach einem früheren Lauf ergänzt): Env neu setzen und neu deployen
  if (state.envSet) {
    console.log(
      '  Stripe nachträglich eingerichtet: Env wird neu gesetzt und neu deployt.',
    );
    state.envSet = false;
    state.localEnv = false;
    state.deployed = false;
    state.live = false;
  }
  save();
}

async function updateStripeUrls() {
  await stripeApi('POST', `/v1/webhook_endpoints/${state.stripeWebhookId}`, {
    url: `${state.siteUrl}/api/billing/webhook`,
  });
  await stripeApi(
    'POST',
    `/v1/billing_portal/configurations/${state.stripePortalConfig}`,
    portalUrls(),
  );
}

function stripeSdkApiVersion() {
  const file = resolve(ROOT, 'apps/web/node_modules/stripe/esm/apiVersion.js');
  const version = existsSync(file)
    ? readFileSync(file, 'utf8').match(/ApiVersion = '([^']+)'/)?.[1]
    : undefined;
  // ohne Version nähme Stripe den Konto-Default, und die Payloads passten nicht mehr zur SDK
  if (!version)
    throw new Error(
      `Stripe-API-Version nicht gefunden (${file}); im Template pnpm install ausführen.`,
    );
  return version;
}

function portalUrls() {
  return {
    default_return_url: `${state.siteUrl}/home/billing`,
    business_profile: { privacy_policy_url: `${state.siteUrl}/datenschutz` },
  };
}

function priceEnvKeys() {
  return Object.keys(billing.products).map(
    (key) => `STRIPE_PRICE_${key.toUpperCase()}`,
  );
}

function stripeEnv() {
  return {
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_PORTAL_CONFIGURATION: state.stripePortalConfig,
    ...Object.fromEntries(
      Object.entries(state.stripePrices).map(([key, id]) => [
        `STRIPE_PRICE_${key.toUpperCase()}`,
        id,
      ]),
    ),
  };
}

async function writeLocalEnv() {
  // Lokale Entwicklung nutzt den lokalen Stack (.env.development); hier nur Projekt-Secrets.
  const file = resolve(web, '.env.local');
  writeFileSync(
    file,
    [
      `# Von studio:new erzeugt (${new Date().toISOString().slice(0, 10)}). Nie committen.`,
      `NEXT_PUBLIC_PRODUCT_NAME=${name}`,
      `CRON_SECRET=${state.cronSecret}`,
      `SUPABASE_PROJECT_REF=${state.supabaseRef}`,
      `SUPABASE_DB_PASSWORD=${state.dbPassword}`,
      '# Stripe (Testmodus); Webhook-Secret lokal aus `stripe listen --print-secret`',
      ...Object.entries(
        state.stripeConfigured
          ? stripeEnv()
          : Object.fromEntries(
              ['STRIPE_SECRET_KEY', ...priceEnvKeys()].map((k) => [k, '']),
            ),
      ).map(([k, v]) => `${k}=${v}`),
      'STRIPE_WEBHOOK_SECRET=',
      '',
    ].join('\n'),
  );
  chmodSync(file, 0o600);
  state.localEnv = true;
  save();
}

async function deploy() {
  const scope = env.VERCEL_SCOPE ? ['--scope', env.VERCEL_SCOPE] : [];
  const vercelEnv = { VERCEL_TOKEN: env.VERCEL_TOKEN };
  run(
    'pnpm',
    ['dlx', VERCEL_CLI, 'link', '--yes', '--project', name, ...scope],
    { cwd: target, env: vercelEnv },
  );
  const url = run(
    'pnpm',
    ['dlx', VERCEL_CLI, 'deploy', '--prod', '--yes', ...scope],
    {
      cwd: target,
      env: vercelEnv,
      capture: true,
    },
  )
    .trim()
    .split('\n')
    .pop();
  console.log(`  Deployment: ${url}`);
  state.deployed = true;
  save();
}

async function waitForHealth() {
  const deadline = Date.now() + 3 * 60_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${state.siteUrl}/api/health`).catch(
      () => null,
    );
    if (response?.ok) {
      state.live = true;
      save();
      return;
    }
    await sleep(5_000);
  }
  throw new Error(
    `${state.siteUrl}/api/health antwortet nach 3 Minuten nicht mit 200.`,
  );
}

// --- Helfer -----------------------------------------------------------------

async function step(label, fn, done) {
  if (done()) {
    console.log(`✓ ${label} (bereits erledigt)`);
    return;
  }
  const t0 = Date.now();
  console.log(`▶ ${label}`);
  await fn();
  timings.push([label, Date.now() - t0]);
}

// gleiche Auflösung wie `with-env` in apps/web/package.json (relativ ab apps/web)
function sharedSecretsPath() {
  return resolve(
    ROOT,
    'apps/web',
    process.env.STUDIO_SECRETS_DIR ?? '../../../studio-secrets',
    process.env.STUDIO_SECRETS_FILE ?? '.env.shared',
  );
}

function loadSharedSecrets() {
  const file = sharedSecretsPath();
  if (!existsSync(file)) return {};
  // Werte nur im Speicher halten, nie ausgeben
  const out = execFileSync(
    'pnpm',
    ['--filter', 'web', 'exec', 'dotenvx', 'get', '-f', file],
    {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  return Object.fromEntries(
    Object.entries(JSON.parse(out)).filter(
      ([key]) => !key.startsWith('DOTENV_'),
    ),
  );
}

function supabase(supabaseArgs, extraEnv = {}, input) {
  return run('pnpm', ['exec', 'supabase', ...supabaseArgs], {
    cwd: web,
    env: { SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN, ...extraEnv },
    // stdout nicht abfangen: dort stehen die Fehlermeldungen der CLI
    input,
  });
}

async function supabaseApi(method, path, body) {
  return api(
    `https://api.supabase.com${path}`,
    method,
    env.SUPABASE_ACCESS_TOKEN,
    body,
  );
}

async function vercelApi(method, path, body) {
  const scope = env.VERCEL_SCOPE
    ? `${path.includes('?') ? '&' : '?'}slug=${encodeURIComponent(env.VERCEL_SCOPE)}`
    : '';
  return api(
    `https://api.vercel.com${path}${scope}`,
    method,
    env.VERCEL_TOKEN,
    body,
  );
}

async function stripeApi(method, path, body) {
  return api(
    `https://api.stripe.com${path}`,
    method,
    env.STRIPE_SECRET_KEY,
    body,
    {
      form: true,
    },
  );
}

async function api(url, method, token, body, { form = false } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': form
        ? 'application/x-www-form-urlencoded'
        : 'application/json',
    },
    body:
      body === undefined
        ? undefined
        : form
          ? formEncode(body)
          : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    // Fehlertexte können den Request zurückspiegeln (z. B. Vault-SQL): bekannte Secrets schwärzen
    const secrets = [
      state?.cronSecret,
      state?.dbPassword,
      state?.serviceRoleKey,
      env.RESEND_API_KEY,
      env.GOOGLE_CLIENT_SECRET,
      env.STRIPE_SECRET_KEY,
      state?.stripeWebhookSecret,
      token,
    ].filter(Boolean);
    // erst schwärzen, dann kürzen (sonst bliebe ein abgeschnittenes Secret stehen)
    const detail = secrets
      .reduce((out, secret) => out.replaceAll(secret, '***'), text)
      .slice(0, 300);
    const error = new Error(
      `${method} ${new URL(url).pathname} → ${response.status}: ${detail}`,
    );
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}

function run(
  cmd,
  cmdArgs,
  { cwd = ROOT, env: extraEnv = {}, capture = false, input } = {},
) {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd,
      env: { ...process.env, ...extraEnv },
      encoding: 'utf8',
      input,
      stdio: [
        input === undefined ? 'inherit' : 'pipe',
        capture ? 'pipe' : 'inherit',
        'inherit',
      ],
    });
  } catch (error) {
    // Node hängt sonst die volle Kommandozeile an (enthält z. B. --db-password)
    const label = [cmd, ...cmdArgs.filter((a) => !a.startsWith('-'))]
      .slice(0, 4)
      .join(' ');
    throw new Error(`${label} … fehlgeschlagen (Exit ${error.status ?? '?'})`);
  }
}

function git(gitArgs) {
  return execFileSync('git', ['-C', target, ...gitArgs], { encoding: 'utf8' });
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
