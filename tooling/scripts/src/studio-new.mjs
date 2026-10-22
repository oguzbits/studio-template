// `pnpm studio:new <name> [--dry-run]`: neues Projekt aus diesem Template anlegen und live schalten.
// Ablauf: Kopie → Supabase (EU) → Migrationen → Vercel-Projekt + Env → Auth/SMTP/Vault → Deploy → Checkliste.
// Wiederholbar: Der Zustand liegt in <ziel>/.studio/state.json; erledigte Schritte werden übersprungen.
import { execFileSync, execSync } from 'node:child_process';
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

import {
  buildChecklist,
  portBase,
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

if (dryRun) {
  console.log(
    `Dry run: würde ${target} anlegen, Supabase-Projekt „${name}“ in ${REGION}, Vercel-Projekt „${name}“ (Root apps/web), Ports ab ${portBase(name)}.`,
  );
  process.exit(0);
}

const state = existsSync(stateFile)
  ? JSON.parse(readFileSync(stateFile, 'utf8'))
  : {};
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
  await step('Env-Variablen setzen', setVercelEnv, () => state.envSet);
  await step(
    'Supabase Auth, SMTP, Vault',
    configureSupabase,
    () => state.supabaseConfigured,
  );
  await step('.env.local schreiben', writeLocalEnv, () => state.localEnv);
  await step('Deploy (Produktion)', deploy, () => state.deployed);
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
});
mkdirSync(resolve(target, 'docs'), { recursive: true });
writeFileSync(
  resolve(target, 'docs/launch-checklist.md'),
  `# Launch-Checkliste ${name}\n\n${checklist}\n`,
);
git(['add', 'docs/launch-checklist.md']);
git(['commit', '-q', '-m', 'docs: launch checklist from studio:new']);

console.log(`\n${checklist}\n`);
console.log('Zeiten:');
for (const [label, ms] of timings)
  console.log(`  ${label.padEnd(28)} ${(ms / 1000).toFixed(0)} s`);
console.log(
  `  ${'Gesamt (live)'.padEnd(28)} ${((Date.now() - startedAt) / 60000).toFixed(1)} min`,
);
console.log(`\nLive: ${state.siteUrl}\nProjekt: ${target}`);

// --- Schritte ---------------------------------------------------------------

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
  mkdirSync(target, { recursive: true });
  execSync(`git -C "${ROOT}" archive HEAD | tar -x -C "${target}"`);
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
  const existing = JSON.parse(
    supabase(['projects', 'list', '-o', 'json']),
  ).find(
    (project) =>
      project.name === name && project.organization_id === env.SUPABASE_ORG_ID,
  );
  state.dbPassword ??= randomBytes(24).toString('base64url');
  save();
  const project =
    existing ??
    JSON.parse(
      supabase([
        'projects',
        'create',
        name,
        '--org-id',
        env.SUPABASE_ORG_ID,
        '--region',
        REGION,
        '--db-password',
        state.dbPassword,
        '-o',
        'json',
      ]),
    );
  state.supabaseRef = project.id ?? project.ref;
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

async function pushMigrations() {
  const dbEnv = { SUPABASE_DB_PASSWORD: state.dbPassword };
  supabase(
    [
      'link',
      '--project-ref',
      state.supabaseRef,
      '--password',
      state.dbPassword,
    ],
    dbEnv,
  );
  supabase(
    ['db', 'push', '--linked', '--include-all', '--password', state.dbPassword],
    dbEnv,
    'y\n',
  );
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
    // pnpm-Version aus packageManager verwenden
    ENABLE_EXPERIMENTAL_COREPACK: '1',
  };
  for (const key of Object.keys(env)) {
    if (
      /^(RESEND_API_KEY|EMAIL_FROM|ANTHROPIC_API_KEY|OPENAI_API_KEY|AI_PROVIDER|AI_MODEL|AI_BASE_URL|ADMIN_EMAILS|SENTRY_DSN|LEGAL_\w+|NEXT_PUBLIC_ANALYTICS_\w+|NEXT_PUBLIC_PLAUSIBLE_\w+|NEXT_PUBLIC_UMAMI_\w+)$/.test(
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

async function configureSupabase() {
  const auth = {
    site_url: state.siteUrl,
    uri_allow_list: `${state.siteUrl}/**`,
  };
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
      '# Stripe (Testmodus) – siehe docs/launch-checklist.md',
      'STRIPE_SECRET_KEY=',
      'STRIPE_WEBHOOK_SECRET=',
      'STRIPE_PRICE_PRO=',
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
    capture: true,
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

async function api(url, method, token, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(
      `${method} ${new URL(url).pathname} → ${response.status}: ${text.slice(0, 300)}`,
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
