import { describe, expect, it } from 'vitest';

import {
  baseFromMessages,
  filterPatch,
  hasNewMigrations,
  isExcluded,
} from './studio-sync-lib.mjs';

const E = '.' + 'env';
const file = (path) =>
  `diff --git a/${path} b/${path}\nindex 1..2 100644\n--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-a\n+b\n`;

describe('isExcluded', () => {
  it.each([
    'docs/x.md',
    'docs/a/b.md',
    'README.md',
    '.gitignore',
    '.vercelignore',
    '.studio/state.json',
    'apps/web/supabase/config.toml',
    E,
    E + '.example',
    `apps/web/${E}.local`,
    `packages/x/${E}.production`,
  ])('schließt %s aus', (p) => expect(isExcluded(p)).toBe(true));

  it.each([
    'apps/web/lib/a.ts',
    'apps/web/README.md',
    'apps/web/supabase/migrations/1_a.sql',
    'apps/web/docs.ts',
    `apps/web/${E}rc.ts`,
  ])('lässt %s durch', (p) => expect(isExcluded(p)).toBe(false));
});

describe('filterPatch', () => {
  it('behält nur erlaubte Dateien und meldet übersprungene', () => {
    const res = filterPatch(
      file('apps/web/a.ts') +
        file('README.md') +
        file(`apps/web/${E}.example`) +
        file('docs/x.md'),
    );
    expect(res.files).toEqual(['apps/web/a.ts']);
    expect(res.skipped).toEqual([
      'README.md',
      `apps/web/${E}.example`,
      'docs/x.md',
    ]);
    expect(res.patch).toContain('apps/web/a.ts');
    expect(res.patch).not.toContain('README.md');
  });

  it('Umbenennung aus ausgeschlossenem Pfad wird entfernt', () => {
    const rename =
      'diff --git a/docs/a.md b/apps/web/a.md\nsimilarity index 100%\nrename from docs/a.md\nrename to apps/web/a.md\n';
    expect(filterPatch(rename).files).toEqual([]);
  });

  it('leerer Diff ergibt leeren Patch', () => {
    expect(filterPatch('').patch).toBe('');
  });
});

describe('baseFromMessages', () => {
  it('nimmt die neueste Nachricht mit sha', () => {
    expect(
      baseFromMessages([
        'fix: x',
        'chore: sync from studio-template abc1234',
        'chore: sync from studio-template 0000000',
      ]),
    ).toBe('abc1234');
  });
  it('null ohne Treffer', () => {
    expect(
      baseFromMessages(['feat: a', 'studio-template ohne sha']),
    ).toBeNull();
  });
});

describe('hasNewMigrations', () => {
  it('erkennt Migrationen', () => {
    expect(hasNewMigrations(['apps/web/supabase/migrations/2_a.sql'])).toBe(
      true,
    );
    expect(hasNewMigrations(['apps/web/supabase/tests/database/a.sql'])).toBe(
      false,
    );
  });
});
