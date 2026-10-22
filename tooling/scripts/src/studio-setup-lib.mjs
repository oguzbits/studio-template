// Entscheidungslogik für studio:setup (der interaktive Teil steht in studio-setup.mjs).
import { execFileSync } from 'node:child_process';

export function nextAction(entry, value, result) {
  return value && result?.ok ? 'ok' : 'ask';
}

// Suffix je `required`-Wert (true | 'warn' | false)
export const SUFFIX = {
  true: '',
  warn: ' (vor Launch nötig)',
  false: ' (optional)',
};
const MARK = { ok: '✓', set: '✓', skipped: '–', failed: '✗' };
const LABEL = {
  ok: 'vorhanden und gültig',
  set: 'neu gesetzt',
  skipped: 'übersprungen',
  failed: 'ungültig',
};

export function summarize(entries, outcomes) {
  const lines = entries.map(
    ({ key, required }) =>
      `${MARK[outcomes[key]]} ${key}  ${LABEL[outcomes[key]]}${SUFFIX[required]}`,
  );
  const missingRequired = entries
    .filter(
      ({ key, required }) =>
        required === true && ['skipped', 'failed'].includes(outcomes[key]),
    )
    .map(({ key }) => key);
  return { lines, missingRequired };
}

// Der Wert steht in der argv; execFileSync-Fehler nennen die ganze Kommandozeile, daher nur Key + Exit-Status melden.
// shortcut: dotenvx set kennt keine stdin-Eingabe, Wert bleibt kurz in argv, bei Änderung am dotenvx-CLI prüfen.
export function setSecret(key, value, file, exec = execFileSync) {
  try {
    exec(
      'pnpm',
      [
        '--filter',
        'web',
        'exec',
        'dotenvx',
        'set',
        key,
        value,
        '-f',
        file,
        '--no-armor',
      ],
      { stdio: ['ignore', 'ignore', 'ignore'] },
    );
  } catch (error) {
    throw new Error(
      `dotenvx set für ${key} fehlgeschlagen (Exit ${error.status ?? '?'})`,
    );
  }
}
