// `pnpm studio:audit <url> [--no-lighthouse]`: misst ein Live-Projekt gegen docs/quality-bar.md.
// Exit-Code 1, wenn ein harter Grenzwert verfehlt wird. Ergebnis zusätzlich als JSON in ./.studio/audits/.
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import bar from './quality-bar.json' with { type: 'json' };
import {
  checkBranding,
  checkHeaders,
  checkLighthouse,
  checkSeo,
  failures,
} from './studio-audit-lib.mjs';

const LIGHTHOUSE = 'lighthouse@12';
const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith('--'))?.replace(/\/$/, '');
if (!base?.startsWith('http')) {
  console.error('Aufruf: pnpm studio:audit <https://…> [--no-lighthouse]');
  process.exit(1);
}

const results = [];
const get = (path, init) =>
  fetch(`${base}${path}`, { redirect: 'manual', ...init });

const home = await get('/');
results.push(...checkHeaders(Object.fromEntries(home.headers)));

for (const path of new Set([...bar.seoPages, ...bar.brandingPages])) {
  const response = await get(path);
  const html = await response.text();
  if (bar.seoPages.includes(path)) {
    results.push(...checkSeo(html, `${base}${path === '/' ? '' : path}`));
  }
  if (bar.brandingPages.includes(path)) results.push(checkBranding(html, path));
}

const sitemap = await (await get('/sitemap.xml')).text();
const foreign = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, loc]) => loc)
  .filter((loc) => !loc.startsWith(base));
results.push({
  id: 'seo:sitemap',
  ok: foreign.length === 0,
  actual: foreign[0] ?? 'nur eigene URLs',
  expected: base,
  hard: true,
});

const status = async (id, path, expected, init) => {
  const { status } = await get(path, init);
  results.push({
    id,
    ok: status === expected,
    actual: String(status),
    expected: String(expected),
    hard: true,
  });
};
await status('robust:404', '/gibt-es-nicht', 404);
await status('robust:webhook-ohne-signatur', '/api/billing/webhook', 400, {
  method: 'POST',
  body: '{}',
});
await status('robust:worker-ohne-token', '/api/jobs/worker', 401);
const health = await (await get('/api/health')).json().catch(() => ({}));
results.push({
  id: 'robust:health-version',
  ok: health.ok === true && Boolean(health.version),
  actual: JSON.stringify(health),
  expected: 'ok + version',
  hard: true,
});

if (!args.includes('--no-lighthouse')) {
  const dir = mkdtempSync(resolve(tmpdir(), 'studio-audit-'));
  try {
    for (const [formFactor, thresholds] of Object.entries(bar.lighthouse)) {
      for (const path of bar.lighthousePages) {
        const out = resolve(dir, 'lhr.json');
        execFileSync(
          'pnpm',
          [
            'dlx',
            LIGHTHOUSE,
            `${base}${path}`,
            '--output=json',
            `--output-path=${out}`,
            '--quiet',
            '--only-categories=performance,accessibility,best-practices,seo',
            '--chrome-flags=--headless=new',
            ...(formFactor === 'desktop' ? ['--preset=desktop'] : []),
          ],
          { stdio: ['ignore', 'ignore', 'inherit'] },
        );
        const lhr = JSON.parse(readFileSync(out, 'utf8'));
        results.push(
          ...checkLighthouse(lhr, `${path} ${formFactor}`, thresholds),
        );
      }
    }
  } catch (error) {
    console.error(
      'Lighthouse fehlgeschlagen (braucht Chrome). Ohne Lighthouse: pnpm studio:audit <url> --no-lighthouse',
    );
    throw error;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const width = Math.max(...results.map((r) => r.id.length));
for (const r of results) {
  const mark = r.ok ? '✓' : r.hard ? '✗' : '!';
  console.log(
    `${mark} ${r.id.padEnd(width)}  ${r.actual.slice(0, 60).padEnd(30)}  Soll: ${r.expected}`,
  );
}
const failed = failures(results);
console.log(
  `\n${results.length - failed.length}/${results.length} bestanden, ${failed.length} harte Fehler.`,
);

const outDir = resolve(process.cwd(), '.studio/audits');
mkdirSync(outDir, { recursive: true });
const file = resolve(
  outDir,
  `${new URL(base).host}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);
writeFileSync(
  file,
  JSON.stringify({ base, at: new Date().toISOString(), results }, null, 2),
);
console.log(`JSON: ${file}`);
process.exit(failed.length ? 1 : 0);
