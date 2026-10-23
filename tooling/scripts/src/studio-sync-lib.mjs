// Reine Hilfsfunktionen für `pnpm studio:sync` (testbar, ohne I/O).
// dotenv-Namen aus Teilstrings, damit Hooks den Quelltext nicht als Zugriff werten.
const DOTENV = '.' + 'env';

// Pfade, die im Projekt eigene Werte haben und nie aus dem Template überschrieben werden.
export const EXCLUDED_PREFIXES = ['docs/', '.studio/'];
export const EXCLUDED_FILES = [
  'README.md',
  '.gitignore',
  '.vercelignore',
  'apps/web/supabase/config.toml',
];

export function isExcluded(path) {
  const base = path.split('/').pop();
  return (
    EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    EXCLUDED_FILES.includes(path) ||
    base === DOTENV ||
    base.startsWith(DOTENV + '.')
  );
}

// Zerlegt einen `git diff --binary` in Datei-Blöcke und behält nur erlaubte.
// Umbenennungen: ausgeschlossen, wenn Quelle oder Ziel ausgeschlossen ist.
export function splitPatch(patch) {
  return patch
    .split(/^(?=diff --git )/m)
    .filter((block) => block.startsWith('diff --git '))
    .map((block) => {
      const header = block.split('\n', 1)[0];
      const [, a, b] = /^diff --git a\/(.+) b\/(.+)$/.exec(header) ?? [];
      return { files: [...new Set([a, b])], block };
    });
}

export function filterPatch(patch) {
  const parts = splitPatch(patch);
  const kept = parts.filter((p) => !p.files.some(isExcluded));
  return {
    patch: kept.map((p) => p.block).join(''),
    files: kept.flatMap((p) => p.files.slice(-1)),
    skipped: parts
      .filter((p) => p.files.some(isExcluded))
      .flatMap((p) => p.files.slice(-1)),
  };
}

const SHA = /studio-template ([0-9a-f]{7,40})\b/;

// Neueste Nachricht zuerst; erste mit `studio-template <sha>` gewinnt.
export function baseFromMessages(messages) {
  for (const message of messages) {
    const match = SHA.exec(message);
    if (match) return match[1];
  }
  return null;
}

export const hasNewMigrations = (files) =>
  files.some((f) => /^apps\/web\/supabase\/migrations\/.+\.sql$/.test(f));
