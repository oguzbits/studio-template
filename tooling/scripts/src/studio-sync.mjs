// `pnpm studio:sync <zielordner> [--dry-run] [--migrate] [--deploy]`: Template-Änderungen in ein `studio:new`-Projekt übernehmen.
// Basis: `syncedFrom` in <ziel>/.studio/state.json, sonst letzte Commit-Nachricht mit `studio-template <sha>`.
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import { baseFromMessages, filterPatch } from './studio-sync-lib.mjs';
import { loadSharedSecrets } from './studio-tokens.mjs';

const VERCEL_CLI = 'vercel@62.7.0'; // shortcut: Version doppelt zu studio-new.mjs, beim nächsten Update beide ändern
const ROOT = resolve(import.meta.dirname, '../../..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const migrate = args.includes('--migrate');
const deploy = args.includes('--deploy');
const dir = args.find((arg) => !arg.startsWith('--'));
if (!dir)
  fail(
    'Aufruf: pnpm studio:sync <zielordner> [--dry-run] [--migrate] [--deploy]',
  );

const target = resolve(process.env.INIT_CWD ?? process.cwd(), dir);
const stateFile = resolve(target, '.studio/state.json');
if (!existsSync(stateFile))
  fail(`${target}/.studio/state.json fehlt (kein studio:new-Projekt?).`);
const state = JSON.parse(readFileSync(stateFile, 'utf8'));

if (git(ROOT, ['status', '--porcelain']).trim())
  fail('Template-Arbeitsbaum ist nicht sauber. Erst committen.');
if (git(target, ['status', '--porcelain']).trim())
  fail('Ziel-Arbeitsbaum ist nicht sauber. Erst committen.');

const base =
  state.syncedFrom ??
  baseFromMessages(git(target, ['log', '-20', '--format=%B%x00']).split('\0'));
if (!base)
  fail(
    'Basis-Commit unbekannt: weder syncedFrom in state.json noch „studio-template <sha>“ in den letzten 20 Commits.',
  );
const baseSha = tryGit(ROOT, [
  'rev-parse',
  '--verify',
  `${base}^{commit}`,
])?.trim();
if (!baseSha) fail(`Basis ${base} existiert im Template nicht.`);
const head = git(ROOT, ['rev-parse', 'HEAD']).trim();
const upToDate = head === baseSha;
if (upToDate) {
  console.log(`Ziel steht bereits auf ${head.slice(0, 7)}.`);
  if (!migrate && !deploy) process.exit(0);
}

function syncPatch() {
  const diff = git(ROOT, ['diff', baseSha, head, '--binary']);
  const { patch, files, skipped } = filterPatch(diff);
  console.log(
    `Basis ${baseSha.slice(0, 7)} → HEAD ${head.slice(0, 7)}: ${files.length} Dateien, ${skipped.length} ausgeschlossen.`,
  );
  if (!patch) {
    console.log('Keine übernehmbaren Änderungen.');
    return files;
  }
  const patchFile = resolve(target, '.git/studio-sync.patch');
  writeFileSync(patchFile, patch);

  if (dryRun) {
    const res = spawnSync(
      'git',
      ['-C', target, 'apply', '--check', '--verbose', patchFile],
      { encoding: 'utf8' },
    );
    console.log(`Betroffen:\n${files.map((f) => `  ${f}`).join('\n')}`);
    const bad = (res.stderr ?? '')
      .split('\n')
      .filter((l) => /^error: /.test(l));
    console.log(
      bad.length
        ? `Nicht anwendbar:\n${bad.join('\n')}`
        : 'Alle Änderungen anwendbar.',
    );
    process.exit(bad.length ? 1 : 0);
  }

  spawnSync(
    'git',
    ['-C', target, 'apply', '--reject', '--whitespace=nowarn', patchFile],
    { stdio: 'inherit' },
  );
  const rejects = git(target, ['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter((f) => f.endsWith('.rej'));
  if (rejects.length) {
    console.error(
      `✗ ${rejects.length} Rejects, nicht committet. Manuell mergen:\n${rejects.map((f) => `  ${f}`).join('\n')}`,
    );
    process.exit(1);
  }

  git(target, ['add', '-A']);
  git(target, [
    'commit',
    '-m',
    `chore: sync from studio-template ${head.slice(0, 7)}`,
  ]);
  state.syncedFrom = head;
  writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  chmodSync(stateFile, 0o600);
  console.log(`✓ Sync committet (${head.slice(0, 7)}).`);
  return files;
}

// up to date: --migrate/--deploy still run (db push only applies pending migrations)
const files = upToDate ? null : syncPatch();

const env = { ...loadSharedSecrets(), ...process.env };
const web = resolve(target, 'apps/web');
try {
  if (migrate) {
    // no diff-based skip: the last sync may carry no migration while an earlier one did; db push applies only pending ones
    {
      for (const key of ['SUPABASE_ACCESS_TOKEN'])
        if (!env[key]) throw new Error(`${key} fehlt.`);
      if (!state.supabaseRef || !state.dbPassword)
        throw new Error('supabaseRef/dbPassword fehlen in state.json.');
      // Passwort per Env statt Argument (nicht in `ps` sichtbar)
      const dbEnv = {
        SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN,
        SUPABASE_DB_PASSWORD: state.dbPassword,
      };
      run(
        'pnpm',
        ['exec', 'supabase', 'link', '--project-ref', state.supabaseRef],
        web,
        dbEnv,
      );
      run(
        'pnpm',
        ['exec', 'supabase', 'db', 'push', '--linked'],
        web,
        dbEnv,
        'y\n',
      );
      console.log('✓ Migrationen gepusht.');
    }
  }
  if (deploy) {
    if (!env.VERCEL_TOKEN) throw new Error('VERCEL_TOKEN fehlt.');
    const scope = env.VERCEL_SCOPE ? ['--scope', env.VERCEL_SCOPE] : [];
    const vercelEnv = { VERCEL_TOKEN: env.VERCEL_TOKEN };
    run(
      'pnpm',
      [
        'dlx',
        VERCEL_CLI,
        'link',
        '--yes',
        '--project',
        basename(target),
        ...scope,
      ],
      target,
      vercelEnv,
    );
    run(
      'pnpm',
      ['dlx', VERCEL_CLI, 'deploy', '--prod', '--yes', ...scope],
      target,
      vercelEnv,
    );
    if (!state.siteUrl)
      throw new Error(
        'siteUrl fehlt in state.json, Health-Check nicht möglich.',
      );
    const response = await fetch(`${state.siteUrl}/api/health`).catch(
      () => null,
    );
    if (!response?.ok)
      throw new Error(`${state.siteUrl}/api/health antwortet nicht mit 200.`);
    console.log('✓ Deploy live, /api/health ok.');
  }
} catch (error) {
  fail(error.message);
}

function git(cwd, gitArgs) {
  return execFileSync('git', ['-C', cwd, ...gitArgs], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
}

function tryGit(cwd, gitArgs) {
  try {
    return git(cwd, gitArgs);
  } catch {
    return null;
  }
}

function run(cmd, cmdArgs, cwd, extraEnv, input) {
  const res = spawnSync(cmd, cmdArgs, {
    cwd,
    env: { ...process.env, ...extraEnv },
    input,
    encoding: 'utf8',
    stdio: [input === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit'],
  });
  // Kommandozeile nicht ausgeben (kann Secrets enthalten)
  if (res.status !== 0)
    throw new Error(
      `${cmd} ${cmdArgs.filter((a) => !a.startsWith('-'))[0]} … fehlgeschlagen (Exit ${res.status ?? '?'})`,
    );
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
