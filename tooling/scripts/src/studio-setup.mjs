// `pnpm studio:setup`: fragt fehlende Werte der gemeinsamen Secrets ab, prüft sie live und schreibt sie
// verschlüsselt per dotenvx. Exit-Code 1, wenn ein Pflicht-Key fehlt. Werte werden nie ausgegeben.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

import {
  SUFFIX,
  nextAction,
  setSecret,
  summarize,
} from './studio-setup-lib.mjs';
import {
  SHARED_KEYS,
  checkKey,
  loadSharedSecrets,
  sharedSecretsPath,
} from './studio-tokens.mjs';

const MAX_TRIES = 3;
const file = sharedSecretsPath();

if (!existsSync(file)) {
  execFileSync('node', [resolve(import.meta.dirname, 'secrets-init.mjs')], {
    stdio: 'inherit',
  });
}

const secrets = loadSharedSecrets();
const rl = createInterface({ input: process.stdin, output: process.stdout });
let muted = false;
let closed = false;
let pending = null;
// ein einziger close-Handler für den ganzen Lauf (kein Listener pro Frage)
rl.once('close', () => {
  closed = true;
  pending?.('');
});
rl.on('SIGINT', () => rl.close());
rl._writeToOutput = (text) => {
  if (!muted) process.stdout.write(text);
};

// Eingabe-Ende (EOF, kein Terminal) zählt als leere Eingabe
const ask = (question, secret) =>
  new Promise((done) => {
    if (closed) return done('');
    pending = done;
    rl.question(question, (answer) => {
      pending = null;
      muted = false;
      if (secret) process.stdout.write('\n');
      done(answer.trim());
    });
    muted = secret;
  });

const outcomes = {};
for (const entry of SHARED_KEYS) {
  if (closed) break;
  const { key, secret, hint, tokenUrl, required } = entry;
  const current = secrets[key];
  const result = current ? await checkKey(key, current, secrets) : undefined;
  if (nextAction(entry, current, result) === 'ok') {
    outcomes[key] = 'ok';
    if (result.warning) console.log(`! ${key}: ${result.warning}`);
    continue;
  }

  console.log(
    `\n${key}${SUFFIX[required]}: ${hint}${result ? `\n  Aktueller Wert ungültig: ${result.error}` : ''}`,
  );
  if (tokenUrl) {
    console.log(`  Token erzeugen: ${tokenUrl}`);
    // optionale Seiten nicht bei jedem Lauf neu öffnen
    if (process.platform === 'darwin' && required !== false) {
      try {
        execFileSync('open', [tokenUrl], { stdio: 'ignore' });
      } catch {}
    }
  }

  outcomes[key] = current ? 'failed' : 'skipped';
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const value = await ask(`  Wert (leer = überspringen): `, secret);
    if (closed) break;
    if (!value) break;
    const check = await checkKey(key, value, { ...secrets, [key]: value });
    if (!check.ok) {
      console.log(`  ✗ ${check.error}`);
      outcomes[key] = 'failed';
      continue;
    }
    // erst nach erfolgreichem Check schreiben, damit nie ein ungültiger Wert in der Datei landet
    try {
      setSecret(key, value, file);
    } catch (error) {
      console.log(`  ✗ ${error.message}`);
      outcomes[key] = 'failed';
      break;
    }
    secrets[key] = value;
    outcomes[key] = 'set';
    if (check.warning) console.log(`  ! ${check.warning}`);
    break;
  }
}
rl.close();

if (closed && Object.keys(outcomes).length < SHARED_KEYS.length) {
  console.log('\nAbgebrochen.');
  process.exit(130);
}

const { lines, missingRequired } = summarize(SHARED_KEYS, outcomes);
console.log(`\n${lines.join('\n')}`);
if (missingRequired.length) {
  console.log(`\nPflicht fehlt noch: ${missingRequired.join(', ')}`);
  process.exit(1);
}
console.log('\nAlle Pflichtwerte gesetzt.');
