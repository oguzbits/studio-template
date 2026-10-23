# AGENTS.md – studio-template

SaaS-Vorlage: Next.js 16 (App Router) + Supabase (EU) + Stripe + Resend + eigene Job-Queue + KI-Schicht.
Basis: MakerKit lite (`packages/*` = `@kit/*`), eigener Code liegt fast nur in `apps/web`.
Lies diese Datei ganz, dann kannst du ein Feature ohne Rückfrage bauen.

## Befehle

| Zweck | Befehl |
| --- | --- |
| Qualitäts-Gate (vor jedem Commit-Push, auch pre-push-Hook) | `pnpm check` (typecheck, lint, format, Unit-Tests, pgTAP, Build) – braucht Docker |
| Dev-Server | `pnpm dev` (lokale Supabase vorher: `pnpm --filter web supabase:start`) |
| Unit-Tests (Vitest) | `pnpm test`, einzeln: `pnpm --filter web exec vitest run lib/jobs` |
| DB-Tests (pgTAP) | `pnpm test:db` (startet Supabase, wendet neue Migrationen an) |
| Neue Migration | `pnpm --filter web exec supabase migration new <name>` → `apps/web/supabase/migrations/` |
| DB-Typen neu erzeugen | `pnpm --filter web supabase:typegen` (nach jeder Migration) |
| E2E (nicht Teil von check) | `pnpm test:e2e` |
| Format/Lint fixen | `pnpm format:fix`, `pnpm lint:fix` |
| Secrets einrichten / prüfen | `pnpm studio:setup` (fragt fehlende Werte ab, prüft live) / `pnpm studio:doctor [url]` (lokal + Live-Projekt) |
| Neues Projekt | `pnpm studio:new <name>` (siehe README) |
| Template-Änderungen in Projekt übernehmen | `pnpm studio:sync <ordner> [--dry-run] [--migrate] [--deploy]` (Template muss committet sein; Rejects → manuell mergen) |

Lokale Ports: 55320–55326 (API 55321, DB 55322, Studio 55323, Mailpit 55324). App: 3000.

## Architektur-Karte (`apps/web`)

| Bereich | Ort | Einstieg |
| --- | --- | --- |
| Produkte, Preise | `config/billing.json` (gelesen von `studio.config.ts` und `studio:new`) | Webhook-Events dort = Events der Route (Test) |
| KI-Modelle, Rechtsangaben-Zugriff | `config/studio.config.ts` | `studioConfig.products.<key>`, `ProductKey` |
| Marketing-Texte (Hero, Features, FAQ, Tagline) | `config/site.config.ts` | leere `faq` → `/faq` 404; Metadaten pro Seite mit `pageMetadata()` aus `lib/page-metadata.ts` |
| Security-Header (CSP usw.) | `config/security-headers.ts` | via `headers()` in `next.config.ts`; neuer externer Host → dort eintragen, sonst blockiert die CSP |
| Env-Prüfung | `config/env-check.ts` | läuft bei jedem Produktions-Build (nicht `build:test`); neue Pflicht-Variable → dort + in `turbo.json` `build.env` |
| Rechtsangaben | `config/legal.ts` (aus `LEGAL_*`-Env) | `(marketing)/(legal)/impressum`, `datenschutz`, `kuendigen` |
| Billing | `lib/billing/` | `requireEntitlement(productKey)`, `createCheckout`, `openPortal`, `accessDecision` |
| Stripe-Webhook | `app/api/billing/webhook/route.ts` | idempotent über `processed_events`, schreibt via `apply_billing_event` |
| E-Mail | `lib/email/send-email.ts`, `lib/email/templates/` | `sendEmail({ to, subject, react, idempotencyKey })` |
| Jobs | `lib/jobs/` | `enqueueJob(type, payload, runAt?)`, Handler in `lib/jobs/registry.ts` |
| Worker | `app/api/jobs/worker/route.ts` | pg_cron jede Minute (Bearer `CRON_SECRET`), Vercel-Cron als Fallback |
| KI | `lib/ai/generate-structured.ts` | `generateStructured({ schema, prompt, model?, system? })` |
| Geschützte App-Seiten | `app/home/*` | Beispiel bezahlte Seite: `app/home/pro/page.tsx` |
| Marketing | `app/(marketing)/*` | Landing, Pricing, Waitlist, Kontakt (`/contact`, Rate-Limit 3/Stunde/IP) |
| Kontakt | `app/(marketing)/contact/` | `submitContact` → `contact_messages`, Job `contact-notification` mailt an `ADMIN_EMAILS[0]` (`lib/jobs/handlers/contact-notification.ts`) |
| Admin | `app/admin/` | `/admin` (Metriken + letzte 20 Nachrichten), `/admin/users` (50/Seite, nur lesend); Loader in `lib/admin/` prüfen `requireAdmin()` selbst |
| Onboarding | `app/home/welcome/` | einmalig, überspringbar; Flag `user_metadata.onboarded` (UX, kein Schutz); Redirect nur von `app/home/page.tsx` |
| Migrationen + Tests | `supabase/migrations/`, `supabase/tests/database/` | pgTAP, `00-rls.test.sql` prüft RLS auf allen Tabellen |

Tabellen (alle mit RLS): `entitlements`, `processed_events`, `billing_customers`, `jobs`, `ai_calls`,
`ai_cache`, `waitlist`, `digest_sends`, `rate_limits`, `contact_messages`. Nutzer dürfen nur ihre eigenen `entitlements` und
`billing_customers` lesen; alles andere läuft über den Admin-Client auf dem Server.

`/admin`: nur bestätigte E-Mail-Adressen aus `ADMIN_EMAILS` (frisch aus `auth.users` gelesen), sonst 404.
E-Mail-Bestätigung muss im gehosteten Supabase-Projekt an bleiben (Default), sonst greift die Allowlist ins Leere.

Zugang: `active`, `trialing`, `canceling` → Zugriff; `past_due`, `unpaid`, `incomplete`, `paused` →
`/home/billing`; keine Berechtigung → `/pricing`.

## Konventionen

- Schema ändert sich nur über neue Migrationen, nie bestehende Migrationen editieren. Jede neue Tabelle:
  `enable row level security`, `revoke all … from anon, authenticated`, nur nötige Policies mit
  `(select auth.uid()) = user_id`. Security-definer-Funktionen mit `set search_path = ''` und
  `revoke execute … from public, anon, authenticated`.
- Danach `supabase:typegen`, pgTAP-Test in `supabase/tests/database/` ergänzen.
- Server-only-Module beginnen mit `import 'server-only';`. Admin-Client (`getSupabaseServerAdminClient`) nur
  serverseitig und nur, wenn RLS bewusst umgangen werden muss.
- Server Actions mit `enhanceAction` aus `@kit/next/actions` (Zod-Schema, `auth`).
- Imports: `~/config/*`, `~/lib/*`, `~/components/*`, `~/` = `app/`. Kit-Pakete als `@kit/*`.
- UI-Texte Englisch (next-intl, nur `en`); nur Rechtsseiten Deutsch. Kein Design-Polish nötig, `@kit/ui` nutzen.
- Tests liegen neben dem Code (`*.test.ts`), Vitest. Externe Dienste (Stripe, Resend, KI) werden gemockt.
- Jeder Test einer Schutzfunktion (Auth, Idempotenz, RLS, Secret-Check) muss rot werden, wenn der Schutz fehlt.
- Kleine Commits im Conventional-Commit-Stil (`feat(billing): …`). Hooks nie mit `--no-verify` umgehen.
- Absende-Buttons brauchen `type="submit"`: der `Button` aus `@kit/ui` (Base UI) ist standardmäßig `type="button"`,
  das Formular schickt sonst nie ab (Unit-Tests merken das nicht, E2E schon). Für Links `buttonVariants` auf `Link`.
- E2E lokal: `pnpm --filter web build:test`, `start:test`, dann `pnpm --filter web-e2e exec playwright test --retries=0`
  (das `test`-Skript bricht mit `--max-failures=1` früh ab; der Dev-Server scheitert am Next-Overlay). Server
  Actions antworten bei Client-Redirects mit 200 + `x-action-redirect`, nicht 303. Kontakt-E2E braucht den
  lokalen Supabase-Container (`SUPABASE_DB_CONTAINER` oder `supabase_db_<project_id>`).
- Bewusste Abkürzungen als Kommentar: `shortcut: <Grenze>, <wann ausbauen>`.

## Secrets

- Nie Secrets ausgeben oder committen. `.env.local`, `.env.keys` und `studio-secrets/.env.shared` nicht lesen
  oder schreiben (Hooks blockieren das). Vorlage für alle Variablen: `.env.example`.
- Env-Ladereihenfolge: `../studio-secrets/.env.shared` (dotenvx, verschlüsselt) → `apps/web/.env.local` (gewinnt).
- Neue Env-Variable: in `.env.example` mit Kommentar und Markierung `[shared]`/`[local]`/`[public]` eintragen;
  bei Bedarf in `tooling/scripts/src/studio-new.mjs` (Vercel-Env-Übernahme) ergänzen.

## So baust du ein bezahltes Feature

1. Produkt in `config/billing.json` unter `products` anlegen (`mode: 'subscription'` mit `priceMonthlyEur` oder
   `'payment'` mit `priceEur`); `STRIPE_PRICE_<KEY>` in `.env.example` eintragen. `studio:new` legt Produkt und
   Preis in Stripe an; bestehende Projekte: Preis im Stripe-Dashboard anlegen und `STRIPE_PRICE_<KEY>` setzen.
2. Seite unter `app/home/<feature>/page.tsx`; im Server-Component `await requireEntitlement('<key>')`
   (leitet selbst um). Muster: `app/home/pro/page.tsx`.
3. Kauf-Button: `<form action={createCheckout.bind(null, '<key>')}>` (Pricing- und Billing-Seite listen alle
   Produkte aus `studio.config.ts` bereits automatisch).
4. Eigene Daten des Features: Migration mit RLS (siehe Konventionen), pgTAP-Test, Typegen.
5. Hintergrundarbeit → Job (Skill `add-cron-job`), Mail → Template (Skill `add-email-template`),
   KI → `generateStructured` (Skill `add-ai-task`).
6. Tests: Unit-Test für die Logik; bei geschützten Seiten reicht `requireEntitlement` (bereits getestet).
7. `pnpm check` grün → committen.

Detaillierte Schritt-für-Schritt-Anleitungen: `.claude/skills/{add-paid-feature,add-cron-job,add-email-template,add-ai-task}/SKILL.md`.

## Design pro Produkt

Die Vorlage bleibt bewusst neutral (ruhige editoriale Basis aus Runde 2b: warmes Neutral, Newsreader + Geist, ein
grüner Akzent). Für ein **neues Produkt** den Skill `taste-skill:design-taste-frontend` mit vollem Ablauf nutzen
(Seiten: Direction ziehen, Idee aus dem Produkt, Inspector; App-Screens: `references/app-screens.md`) und das Ergebnis
in `config/site.config.ts`, `styles/shadcn-ui.css` und `lib/fonts.ts` festhalten. Vor jedem Release Screenshots auf
Fremd-Branding prüfen (Logo steckt als SVG-Pfad, Text-Grep findet es nicht).

## Nicht bauen (bewusst ausgelassen)

Teams/Rollen, Blog, mehrere Zahlungsanbieter, weitere Sprachen, Design-Polish.
