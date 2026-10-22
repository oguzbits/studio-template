// Legt das private Secrets-Repo (Default ../studio-secrets) mit verschlüsselter Shared-Datei an.
// Einmalig vom Nutzer auszuführen: `pnpm studio:secrets:init`. Überschreibt nie eine vorhandene Datei.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const dir = resolve(
  root,
  process.env.STUDIO_SECRETS_DIR ?? '../studio-secrets',
);
const file = resolve(dir, process.env.STUDIO_SECRETS_FILE ?? '.env.shared');

const TEMPLATE = `# Gemeinsame Secrets für alle Studio-Projekte (dotenvx-verschlüsselt).
# Wert setzen (wird automatisch verschlüsselt):
#   pnpm --filter web exec dotenvx set KEY "wert" -f ${file} --no-armor
# Der private Schlüssel liegt im OS-Keystore (dotenvx native) bzw. in .env.keys (nie committen).

# Bootstrap (studio:new)
SUPABASE_ACCESS_TOKEN=
SUPABASE_ORG_ID=
VERCEL_TOKEN=
# Optional: Vercel-Team-Slug, leer = persönlicher Account
VERCEL_SCOPE=

# E-Mail (ein Resend-Konto, Domain pro Produkt)
RESEND_API_KEY=

# KI (nur der Key des in AI_PROVIDER gewählten Anbieters wird gebraucht)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Betrieb: kommaseparierte E-Mails mit Zugriff auf /admin
ADMIN_EMAILS=

# Impressum (Anbieter für alle Produkte)
LEGAL_NAME=
LEGAL_STREET=
LEGAL_ZIP_CITY=
LEGAL_EMAIL=
LEGAL_PHONE=
LEGAL_VAT_ID=
LEGAL_RESPONSIBLE=
`;

if (existsSync(file)) {
  console.error(`Existiert bereits: ${file} – nichts geändert.`);
  process.exit(1);
}

mkdirSync(dir, { recursive: true });
if (!existsSync(resolve(dir, '.git'))) execFileSync('git', ['init', '-q', dir]);
if (!existsSync(resolve(dir, '.gitignore'))) {
  writeFileSync(resolve(dir, '.gitignore'), '.env.keys\n.DS_Store\n');
}
writeFileSync(file, TEMPLATE);
execFileSync(
  'pnpm',
  ['--filter', 'web', 'exec', 'dotenvx', 'encrypt', '-f', file, '--no-armor'],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
console.log(
  `Angelegt: ${file}\nWerte setzen mit: pnpm --filter web exec dotenvx set KEY "wert" -f ${file} --no-armor`,
);
