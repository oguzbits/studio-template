// `pnpm studio:doctor [url]`: prüft das lokale Setup und optional ein Live-Projekt.
// Ausgabe wie studio:audit (✓ ok, ! Warnung, ✗ Fehler); Exit-Code 1 bei hartem Fehler.
import { execFileSync } from 'node:child_process';

import { failures } from './studio-audit-lib.mjs';
import { checkLive, runLocalChecks } from './studio-doctor-lib.mjs';
import { loadSharedSecrets } from './studio-tokens.mjs';

const base = process.argv
  .slice(2)
  .find((a) => !a.startsWith('--'))
  ?.replace(/\/$/, '');
if (base && !base.startsWith('http')) {
  console.error('Aufruf: pnpm studio:doctor [https://…]');
  process.exit(1);
}

const out = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

const results = await runLocalChecks({
  node: () => process.versions.node,
  docker: () => out('docker', ['info']),
  supabaseCli: () =>
    out('pnpm', ['--filter', 'web', 'exec', 'supabase', '--version']),
  secrets: loadSharedSecrets,
});
if (base) results.push(...(await checkLive(base)));

const width = Math.max(...results.map((r) => r.label.length));
for (const r of results) {
  const mark = r.ok ? '✓' : r.hard ? '✗' : '!';
  console.log(
    `${mark} ${r.label.padEnd(width)}${r.detail ? `  ${r.detail}` : ''}`,
  );
}
const failed = failures(results);
console.log(`\n${failed.length} harte Fehler.`);
process.exit(failed.length ? 1 : 0);
