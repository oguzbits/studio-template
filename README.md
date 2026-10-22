# studio-template

Eigene SaaS-Vorlage auf Basis von MakerKit lite (MIT, siehe `NOTICE`): Login, Stripe-Abos und Einmalkäufe,
Resend-Mails, Job-Queue mit Daily-Digest, KI-Schicht, Rechtsseiten, `/admin`. Für Agenten: `AGENTS.md`.

## Neues Projekt in unter 30 Minuten

Einmalig:

1. `pnpm studio:secrets:init` legt `../studio-secrets/.env.shared` an (dotenvx-verschlüsselt, Schlüssel im
   OS-Schlüsselbund). Werte setzen mit
   `pnpm --filter web exec dotenvx set KEY wert -f ../../../studio-secrets/.env.shared --no-armor`:
   - Pflicht: `SUPABASE_ACCESS_TOKEN` (Supabase → Account → Access Tokens), `SUPABASE_ORG_ID`,
     `VERCEL_TOKEN` (Vercel → Account → Tokens), bei Team-Accounts `VERCEL_SCOPE`, `RESEND_API_KEY`
     (setzt auch Supabase-SMTP; ohne bricht der Produktions-Build ab).
   - Empfohlen: `STRIPE_SECRET_KEY` (Test, `sk_test_…`): `studio:new` legt dann Produkte, Preise, Webhook und
     Kundenportal selbst an.
   - Optional: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
     `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`, `LEGAL_*`.
2. Docker läuft (für lokale Supabase und `pnpm check`).

Pro Projekt (Template-Repo muss committet sein):

```bash
pnpm studio:new mein-projekt            # --dry-run zeigt nur den Plan
```

Das Skript kopiert `HEAD` nach `../mein-projekt` (eigene lokale Ports), legt ein Supabase-Projekt in
`eu-central-1` an, pusht die Migrationen, legt das Vercel-Projekt (Root `apps/web`) samt Env-Variablen an,
setzt Supabase Auth-URLs, SMTP und die Vault-Secrets für pg_cron, schreibt `apps/web/.env.local`, deployt
und wartet auf `/api/health`. Bricht ein Schritt ab, setzt ein erneuter Aufruf dort fort
(Zustand in `.studio/state.json`, nicht committet). Mit `STRIPE_SECRET_KEY` (Test) legt es auch Produkte und
Preise aus `apps/web/config/billing.json`, den Webhook und das Kundenportal an – nur im Testmodus; für echte
Zahlungen Live-Key setzen und Produkte, Preise, Webhook und Portal im Live-Modus anlegen. Am Ende laufen ein Schnell-Audit und
die Checkliste der verbleibenden manuellen Schritte (Resend-Domain/DNS, Domain) in `docs/launch-checklist.md`.

Fehler-Monitoring: Sentry ist nur aktiv, wenn `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` gesetzt sind. Empfohlen ist die EU-Region (de.sentry.io).

Security-Header: Blockiert die CSP etwas (Konsole: „violates the following Content Security Policy“), neuen Host in
`apps/web/config/security-headers.ts` eintragen. Zum Eingrenzen mit `CSP_REPORT_ONLY=true` deployen: Verstöße
werden dann nur gemeldet.

Env-Variablen: siehe `.env.example`. Lokale Supabase des Templates: Ports 55320–55326.

E2E-Smoke (Login → Stripe-Testcheckout → geschützte Seite), nicht Teil von `pnpm check`:
`STRIPE_SECRET_KEY` (sk_test_…), `STRIPE_PRICE_PRO` und `STRIPE_WEBHOOK_SECRET` (aus
`stripe listen --print-secret`) in `apps/web/.env.local`, dann parallel `pnpm dev`,
`stripe listen --forward-to localhost:3000/api/billing/webhook` und `E2E_BILLING=true pnpm test:e2e`.

## Herkunft und Lizenz

Basis ist [MakerKit lite](https://github.com/makerkit/nextjs-saas-starter-kit-lite) (MIT), stark umgebaut;
Upstream-Updates werden nicht übernommen. Lizenz: MIT, siehe `LICENSE` und `NOTICE`.
