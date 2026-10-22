// Stop-Hook: schnelle Verifikation geänderter Quelldateien (Typprüfung, Lint, betroffene Tests).
// Das volle `pnpm check` bleibt Pre-push. Bei Fehlern wird das Beenden blockiert.
import { execFileSync, spawnSync } from 'node:child_process';
import { readInput } from './hook-io.mjs';

const input = readInput();
if (input.stop_hook_active) process.exit(0); // Endlosschleife vermeiden

// -uall lists files inside new directories instead of the directory itself
const changed = execFileSync('git', ['status', '--porcelain', '-uall'], {
  encoding: 'utf8',
})
  .split('\n')
  .map((line) => line.slice(3).trim())
  .filter((file) => /^(apps|packages|tooling)\/.*\.(ts|tsx|mjs)$/.test(file));
if (changed.length === 0) process.exit(0);

const webChanged = changed
  .filter((file) => file.startsWith('apps/web/'))
  .map((file) => file.slice('apps/web/'.length));

const steps = [
  ['pnpm', ['typecheck']],
  // changed files may all be in .oxlintrc ignorePatterns
  ['pnpm', ['exec', 'oxlint', '--no-error-on-unmatched-pattern', ...changed]],
];
if (webChanged.length > 0) {
  steps.push([
    'pnpm',
    [
      '--filter',
      'web',
      'exec',
      'vitest',
      'related',
      '--run',
      '--passWithNoTests',
      ...webChanged,
    ],
  ]);
}

for (const [cmd, args] of steps) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', timeout: 90_000 });
  if (result.status !== 0) {
    const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-3000);
    process.stderr.write(
      `Verifikation fehlgeschlagen (${cmd} ${args.slice(0, 2).join(' ')}):\n${out}\n`,
    );
    process.exit(2);
  }
}
