// Entscheidungslogik für studio:setup (der interaktive Teil steht in studio-setup.mjs).

export function nextAction(entry, value, result) {
  return value && result?.ok ? 'ok' : 'ask';
}

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
      `${MARK[outcomes[key]]} ${key}  ${LABEL[outcomes[key]]}${required ? '' : ' (optional)'}`,
  );
  const missingRequired = entries
    .filter(
      ({ key, required }) =>
        required && ['skipped', 'failed'].includes(outcomes[key]),
    )
    .map(({ key }) => key);
  return { lines, missingRequired };
}
