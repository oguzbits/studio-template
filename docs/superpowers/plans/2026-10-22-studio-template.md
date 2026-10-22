# studio-template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eigene, kostenlose SaaS-Vorlage, aus der `pnpm studio:new <name>` in < 30 Minuten ein live laufendes Projekt (Login, Stripe-Testzahlung, E-Mail, täglicher Job) macht.

**Architecture:** Snapshot von makerkit/nextjs-saas-starter-kit-lite (Turborepo, `apps/web` Next.js 16, Supabase). Neue Bausteine leben in `apps/web/lib/<baustein>/` (Server-only) plus Routen unter `apps/web/app/`. Zustandslogik, die atomar sein muss (Webhook-Idempotenz, Job-Claim, Retry), liegt als SQL-Funktion in Migrationen; TS ruft sie per `rpc()` mit Service-Role auf.

**Tech Stack:** Next.js 16.4, React 19.3, Supabase (Postgres 15, pg_cron, pg_net, Vault), Stripe, Resend + React Email, Zod 4, Vitest 5, pgTAP (`supabase test db`), Playwright, dotenvx, Sentry, oxlint/oxfmt (aus dem Kit).

**Spec:** Auftrag „studio-template an einem Tag“ (im Chat vom 2026-10-22; Kernpunkte unten unter Global Constraints).

## Bestandsaufnahme (Stand 2026-10-22)

- **makerkit lite @ 9ff430d (2026-10-15), MIT:** pnpm-Workspace mit Catalog, Turborepo. `apps/web` (Next 16.4, next-intl, nur Locale `en`), `apps/e2e` (Playwright, Mailpit-Mailbox-Helper auf :54324), `packages/{ui,supabase,auth,accounts,i18n,next,shared}`, `tooling/{scripts,typescript}`. Eine Migration (`accounts`-Tabelle mit RLS, Storage-Bucket). Auth: Passwort, Magic Link, Google (per Env). Marketing: Landing, FAQ, Privacy/Terms/Cookie (englische Platzhalter). `/home` mit Demo-Dashboard und Settings. Sitemap (`next-sitemap`), `robots.ts`. Lint/Format: oxlint/oxfmt. Vitest steht im Catalog, aber kein Paket hat Unit-Tests. Kein Billing, keine Mails außer Supabase-Auth, keine Jobs, kein Sentry. `dotenv-cli` für das Env-Loading.
- **nextjs/saas-starter @ 6e33e58, MIT:** Drizzle + Stripe. Übernommen wird nur das Muster aus `lib/payments/stripe.ts` (Checkout-Session, Portal-Konfiguration, `handleSubscriptionChange`) und `app/api/stripe/{checkout,webhook}`: Signatur prüfen, Subscription bei jedem Event frisch von Stripe holen. Kein Drizzle, keine Teams.
- **notar-agent-Hooks:** `.claude/settings.json` (PreToolUse Bash/Write-Guards, Stop-Hook mit Schnellprüfung auf geänderten Dateien, `deny` für `.env*`/Keys), `scripts/agent/{guards,hook-*}.mjs` + `guards.test.mjs`, Husky `pre-commit` (lint-staged) und `pre-push` (check).
- **Lokale Tools:** node 26.12, pnpm 12.14, Docker 29.9, gh. **Fehlen:** supabase CLI (kommt als devDependency aus dem Kit), vercel CLI, stripe CLI, dotenvx. Freier Speicher: 24 GB (88 % belegt), reicht für den lokalen Supabase-Stack.

## Global Constraints

- Nur kostenlose Dienste/Free Tiers. Neue Abhängigkeiten nur aus der freigegebenen Liste (siehe Annahmen A1).
- Supabase-Region EU: `eu-central-1` (Frankfurt).
- RLS auf **allen** neuen Tabellen; alle Schemaänderungen als Migration in `apps/web/supabase/migrations/`.
- Keine Secrets im Repo; `.env.example` vollständig und kommentiert. `.env.test` enthält nur die bekannten lokalen Supabase-Demo-Keys und Dummy-Werte.
- Zugriff bei Status: `active`, `trialing`, `canceling` → Zugriff. `past_due`, `unpaid`, `incomplete`, `paused` → Redirect `/home/billing`. Kein Eintrag/`canceled` → Redirect `/pricing`.
- Jobs: max. 5 Versuche, exponentieller Backoff, Claim mit `FOR UPDATE SKIP LOCKED`.
- Lizenzen: `LICENSE` (MakerKit, MIT) bleibt, `NOTICE` nennt MakerKit + Vercel saas-starter mit Commit-Hash und MIT-Text.
- Bewusst nicht: Teams/Orgs, Rollen, Blog, mehrere Zahlungsanbieter, Design-Feinschliff, neue Sprachen.
- Bestehende Kit-Konventionen (oxlint/oxfmt, `@kit/*`-Pakete, `requireUser`, `getSupabaseServerAdminClient`, next-safe-action/Server Actions, Catalog-Versionen) haben Vorrang.

## Annahmen (Routineentscheidungen, widersprich falls falsch)

- **A1 Abhängigkeiten**, die aus der Spec folgen und ich ohne Rückfrage hinzufüge: `stripe`, `resend`, `@react-email/components`, `@sentry/nextjs`, `@dotenvx/dotenvx`, `vercel` (CLI, devDep), `husky` + `lint-staged` (wie notar-agent), `vitest` (schon im Catalog). Offene Abhängigkeitsfragen: siehe „Fragen“.
- **A2** Zusatztabelle `billing_customers(user_id pk, provider, customer_id unique)`: das Kundenportal braucht die Stripe-Customer-ID. Zusatztabelle `ai_cache(key pk, response jsonb, created_at)` und `digest_sends(user_id, day, pk(user_id, day))` für Cache bzw. Digest-Idempotenz. `entitlements` bleibt exakt wie spezifiziert, plus `unique(user_id, product_key)` und `created_at/updated_at`.
- **A3** `canceling` = Stripe `active` mit `cancel_at_period_end = true`. `incomplete_expired` → `canceled`. Einmalkauf → `active`, `current_period_end = null`, `provider_ref = payment_intent`.
- **A4** MRR im Admin = Summe der aktiven Abos × Monatspreis aus `studio.config.ts` (`products[key].priceMonthlyEur`). Kein Stripe-API-Aufruf.
- **A5** Ein Secret für Cron/Worker: `CRON_SECRET` als `Authorization: Bearer …`. Das ist der Header, den Vercel Cron sendet; pg_net sendet denselben (Secret aus Supabase Vault).
- **A6** Legal: `/impressum` und `/datenschutz` ersetzen die englischen Kit-Seiten privacy/terms/cookie (die werden gelöscht; cookieless → keine Cookie-Policy).
- **A7** `pnpm check` braucht Docker (lokaler Supabase-Stack für die pgTAP-Tests). Der E2E-Smoke ist **nicht** Teil von `check` (braucht Stripe-Testkeys + Stripe CLI), sondern läuft als `pnpm test:e2e`.
- **A8** `studio:new` legt das neue Projekt unter `../<name>` an (`git archive HEAD`, damit nichts Untracktes mitkommt), `git init`, erster Commit. Kein GitHub-Repo; Deploy per `vercel deploy --prod` aus der CLI.
- **A9** Shared Secrets: `STUDIO_SECRETS_FILE` (Default `../studio-secrets/.env.shared`, relativ zum Repo-Root), entschlüsselt mit `DOTENV_PRIVATE_KEY_SHARED` aus der Shell oder aus `studio-secrets/.env.keys`. `.env.local` überschreibt Shared (`--overload`).

## Entscheidungen des Nutzers (2026-10-22)

- KI: eigene fetch-Adapter (Anthropic + OpenAI-kompatibel), keine KI-SDK-Abhängigkeit.
- UI-Sprache bleibt Englisch (Kit), nur Impressum/Datenschutz/Kündigen auf Deutsch.
- Externe Schritte (CLI-Installation, Supabase-Projekt, Vercel-Deploy) erlaubt, aber vor dem ersten externen Schritt einmal kurz fragen.
- `../studio-secrets` lege ich lokal an: verschlüsselte `.env.shared` mit leeren Werten, `.env.keys` in `.gitignore`. Kein GitHub-Repo.
- Lokale Supabase-Ports 55320–55326 (statt 543xx), wegen Konflikt mit anderen lokalen Stacks; `project_id = "studio-template"`.
- Guard: Die vier committeten, öffentlichen Kit-Env-Dateien (`apps/web/.env`, `.env.development`, `.env.production`, `.env.test`) lösen „ask“ aus statt „deny“.

## Umsetzungsnotizen

- Die Agent-Hook-Skripte liegen in `tooling/scripts/src/agent/` (Tests laufen über `pnpm test`), nicht in `scripts/agent/`.
- Das Secrets-Repo legt der Nutzer einmalig mit `pnpm studio:secrets:init` an (der Guard blockt den Agenten beim Schreiben von `.env.shared`, und das ist gewollt). dotenvx speichert den Schlüssel im OS-Keystore, und Armor (der gehostete Dienst) ist per `--no-armor` aus.
- `studio.config.ts` liegt nach Kit-Konvention in `apps/web/config/studio.config.ts` und wird in M2 angelegt (erster Nutzer).
- dotenvx `--overload`: Dateiwerte überschreiben auch Shell-Variablen.

## Review Focus

1. **Webhook-Events in falscher Reihenfolge** (z. B. `subscription.updated` vor `checkout.session.completed`): Der Endzustand muss trotzdem stimmen. Deshalb wird die Subscription immer frisch von Stripe geholt (Test in M2).
2. **Worker stirbt mitten im Job**: Der Job darf nicht ewig in `running` hängen. Beim Claim wird `run_at = now() + 10 min` gesetzt (Sichtbarkeits-Timeout), und `running`-Jobs mit abgelaufenem `run_at` werden neu geclaimt (pgTAP-Test in M4).
3. **Digest-Versand schlägt nach dem Reservieren fehl**: Die Zeile in `digest_sends` wird wieder gelöscht und der Fehler weitergeworfen, damit der Retry sendet (Test in M4).
4. **Modell ohne Preis in der Preistabelle**: Der Aufruf läuft trotzdem, mit `cost_eur = null` und einer Warnung; der Admin zeigt die Anzahl unbepreister Aufrufe (Test in M5).
5. **`canceling` nach Ablauf von `current_period_end`, falls `subscription.deleted` verloren geht**: kein Zugriff mehr (`accessDecision` prüft das Periodenende; Test in M2).

## Rechtliches Risiko (nicht im Scope, aber wichtig)

Für Abos an Verbraucher in DE verlangt § 312k BGB einen Kündigungsbutton. Plan: ein Link „Verträge hier kündigen“ im Footer → `/kuendigen` (öffnet das Stripe-Portal nach Login). Ob das ohne Login reicht, musst du rechtlich klären. AGB und Widerrufsbelehrung stehen nur als Punkt in der Checkliste. Die Datenschutz-Vorlage ist kein Rechtsrat.

---

### M0: Basis, Lizenz, Env-Loading, Quality Gate, Hooks

**Files:** gesamter Kit-Snapshot (ohne `.git`), `NOTICE`, `package.json` (Root), `apps/web/package.json`, `apps/web/vitest.config.ts`, `.env.example`, `apps/web/.env.test`, `.claude/settings.json`, `scripts/agent/*` (aus notar-agent, angepasst an pnpm), `.husky/{pre-commit,pre-push}`, `studio.config.ts` (Gerüst).

**Interfaces / Verhalten:**
- Root `check`: `pnpm typecheck && pnpm lint && pnpm format && pnpm test && pnpm test:db && pnpm build:test`. Bricht beim ersten Fehler ab.
- `test:db`: startet den lokalen Supabase-Stack, falls er nicht läuft, dann `supabase test db`.
- `with-env` in `apps/web`: `dotenvx run -f ${STUDIO_SECRETS_FILE:-../../../studio-secrets/.env.shared} -f .env.local --overload --`. Fehlt die Shared-Datei, nur eine Warnung (beim Umsetzen prüfen, wie sich dotenvx verhält).
- `studio.config.ts` (Root, exportiert `studio`): `{ name, products: Record<ProductKey, { mode: 'subscription'|'payment', stripePriceEnv: string, priceMonthlyEur?: number }>, legal: {...aus Env}, ai: { prices: Record<model, { inEurPerMTok, outEurPerMTok }> } }`, mit Zod validiert.
- Hooks: Bash-Guard (blockt `--no-verify`, `git push --force`, `cat .env*`), File-Guard (blockt Schreiben in `.env`, `.env.local`), Stop-Hook (typecheck + lint auf geänderten Dateien).

**Tests:** `scripts/agent/guards.test.mjs` (aus notar-agent übernommen, läuft in `pnpm test`).
**Muss rot werden:** Wird die `--no-verify`-Regel in `guards.mjs` entfernt, schlägt der Guard-Test fehl.

- [x] Snapshot kopieren, `pnpm install`, `pnpm check` grün (mit leerem Vitest-Lauf `--passWithNoTests` in M0).
- [x] Commit `chore: import makerkit lite 9ff430d + NOTICE, dotenvx, pnpm check, agent hooks`

### M1: Datenbank-Fundament

**Files:** `apps/web/supabase/migrations/<ts>_studio_core.sql`, `apps/web/supabase/tests/database/*.test.sql`, `apps/web/lib/database.types.ts` (Typegen).

**Tabellen** (alle mit `enable row level security`):
- `entitlements`: Spalten wie spezifiziert; `status` als enum `entitlement_status` (`active, trialing, canceling, past_due, unpaid, incomplete, paused, canceled`); Policy: `select` nur für `auth.uid() = user_id`. Kein insert/update für Clients.
- `processed_events(event_id text pk, provider text, processed_at timestamptz default now())`: keine Policies.
- `billing_customers`: `select` nur für den eigenen Eintrag.
- `jobs`: Spalten wie spezifiziert; `status` enum (`queued, running, done, failed`); Index `(status, run_at)`; keine Policies.
- `ai_calls(id, model, tokens_in, tokens_out, cost_eur numeric(10,6) null, latency_ms, cache_hit, created_at)`, `ai_cache`, `waitlist(id, email citext unique, created_at)`, `digest_sends`: keine Policies.

**Tests (pgTAP):** pro Tabelle „RLS ist aktiv“; als `authenticated` sieht Nutzer A die Entitlements von B nicht; `anon` kann in `waitlist` weder lesen noch schreiben.
**Muss rot werden:** Fehlt die Bedingung `user_id = auth.uid()` in der Entitlements-Policy, wird der Test „A sieht B nicht“ rot.

- [x] Migration + Tests, `pnpm check`, Commit `feat(db): core tables with RLS`

### M2: Billing (Stripe)

**Files:** `apps/web/lib/billing/{stripe.ts,status.ts,require-entitlement.ts,checkout-actions.ts}`, `apps/web/app/api/billing/webhook/route.ts`, `apps/web/app/home/billing/page.tsx`, `apps/web/app/home/pro/page.tsx` (Demo-Seite hinter Paywall), Migration `<ts>_billing_fn.sql`, Tests unter `apps/web/lib/billing/__tests__/` und `supabase/tests/database/billing.test.sql`.

**Interfaces:**
- `mapStripeStatus(s: { status: Stripe.Subscription.Status; cancel_at_period_end: boolean }): EntitlementStatus` (Regeln siehe A3).
- `accessDecision(e: Pick<Entitlement,'status'|'current_period_end'> | null, now: Date): 'allow' | 'billing' | 'pricing'`: `allow` nur bei Zugriffs-Status und (`current_period_end` null oder > now).
- `requireEntitlement(productKey: ProductKey): Promise<Entitlement>`: Nutzer über `requireUser` holen (ohne Login → `/auth/sign-in`), dann `redirect()` gemäß `accessDecision`. Gleicher Helper für Server-Komponenten und Route-Handler.
- Server Actions `createCheckout(productKey)` (Modus aus `studio.products`, `client_reference_id = userId`, `metadata.product_key` an Session und Subscription; Customer wird in `billing_customers` angelegt bzw. wiederverwendet) und `openPortal()`.
- SQL `apply_billing_event(p_event_id text, p_user_id uuid, p_product_key text, p_status entitlement_status, p_period_end timestamptz, p_trial_end timestamptz, p_provider_ref text) returns boolean`: `security definer`, nur `service_role` darf es ausführen. In **einer** Transaktion: `insert into processed_events … on conflict do nothing`. Bei Konflikt `return false`, sonst Upsert auf `(user_id, product_key)` und `return true`.
- Webhook: Signatur mit `STRIPE_WEBHOOK_SECRET` prüfen (bei Fehler 400). Behandelt `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`. Für Abos wird die Subscription frisch per `stripe.subscriptions.retrieve` geholt. Unbekannte Events → 200 ohne DB-Schreibzugriff.

**Tests:**
- `status.test.ts`: Tabelle über alle Stripe-Status × `cancel_at_period_end`; `accessDecision` für alle Status, `null`, und `canceling` mit abgelaufenem Periodenende → `pricing`.
- `webhook.test.ts` (Stripe und Supabase gemockt): ungültige Signatur → 400; Event ohne `user_id` → 200 + Log; Reihenfolge `updated` vor `completed` → beide Aufrufe tragen den frisch geholten Status.
- `billing.test.sql`: dasselbe `event_id` zweimal mit **anderem** Status → zweiter Aufruf gibt `false` zurück, Entitlement bleibt beim ersten Status; `authenticated` darf die Funktion nicht ausführen.

**Muss rot werden:** Entfernt man das `on conflict … return false`, wird der Idempotenz-Test rot. Entfernt man den Periodenende-Check, wird der `canceling`-Test rot. Entfernt man `revoke execute`, wird der Rechte-Test rot.

- [x] TDD je Interface, `pnpm check`, Commit `feat(billing): stripe checkout, portal, idempotent webhook, entitlements`

### M3: E-Mail

**Files:** `apps/web/lib/email/{send-email.ts,templates/welcome.tsx,templates/digest.tsx}`, Migration `<ts>_welcome_job.sql`, README-Abschnitt „Auth-Mails über Resend SMTP“.

**Interfaces:**
- `sendEmail({ to, subject, react, idempotencyKey? }): Promise<{ id: string }>`: nutzt Resend (`RESEND_API_KEY`, `EMAIL_FROM`). Ohne API-Key (lokal/Test) wird die Mail nur geloggt und `{ id: 'dev' }` zurückgegeben. Fehler werfen `EmailError`.
- `WelcomeEmail({ name? })`, `DigestEmail({ items: { title: string; url: string; summary?: string }[], date: string })`.
- DB-Trigger auf `auth.users` insert → Job `welcome-email` mit `{ user_id }`.

**Tests:** Der Digest rendert jede URL als Link; leere Liste → kein Versand (Entscheidung liegt beim Job, Test in M4); `sendEmail` ohne Key ruft Resend nicht auf.

- [x] Commit `feat(email): resend wrapper, welcome + digest templates`

### M4: Hintergrund-Jobs (höchstes Risiko neben M2)

**Files:** Migration `<ts>_jobs_fn.sql`, `apps/web/lib/jobs/{worker.ts,registry.ts,handlers/daily-digest.ts,handlers/welcome-email.ts,enqueue.ts}`, `apps/web/app/api/jobs/worker/route.ts`, `apps/web/vercel.json` (Fallback-Cron), Tests.

**Interfaces:**
- SQL `claim_jobs(p_limit int) returns setof jobs`: wählt `status in ('queued','running') and run_at <= now()`, sortiert nach `run_at`, mit `for update skip locked limit p_limit`; setzt `status='running'`, `attempts = attempts + 1`, `run_at = now() + interval '10 minutes'`.
- SQL `complete_job(p_id uuid)` und `fail_job(p_id uuid, p_error text, p_retry_at timestamptz)`: Bei `attempts >= 5` → `failed`, sonst `queued` mit `run_at = p_retry_at`. Alle drei nur für `service_role`.
- TS `retryDelayMs(attempts: number): number = 30_000 * 2 ** attempts`, also 60 s, 2 min, 4 min, 8 min.
- `runWorker({ limit = 10, now }): Promise<{ done: number; failed: number; retried: number }>`: Jobs nacheinander abarbeiten. Ein unbekannter Typ zählt als Fehler.
- Route `POST /api/jobs/worker` (Vercel Cron sendet GET, also auch GET): `Authorization: Bearer ${CRON_SECRET}` mit konstantzeitigem Vergleich prüfen, sonst 401. Fehlt `CRON_SECRET` → 500 (fail closed).
- pg_cron: jede Minute `net.http_post` an den Worker (URL und Secret aus Vault); täglich 06:00 UTC ein `daily-digest`-Job pro Nutzer mit `payload { user_id, day }`.
- Handler `daily-digest`: `insert into digest_sends(user_id, day) on conflict do nothing`. Gibt es die Zeile schon → fertig ohne Versand. Sonst Einträge laden (`getDigestItems(userId, day)`, Beispiel-Stub). Leere Liste → kein Versand. Schlägt der Versand fehl → Zeile löschen und den Fehler werfen.

**Tests:**
- pgTAP: Session B sperrt per `dblink` (offene Transaktion) Job 1, `claim_jobs(10)` liefert dann nur Job 2. Ein `running`-Job mit abgelaufenem `run_at` wird neu geclaimt. `fail_job` beim 5. Versuch → `failed`, beim 4. → `queued` mit `p_retry_at`.
- Vitest: `retryDelayMs` (1→60 000, 4→480 000); `runWorker` mit fehlschlagendem Handler ruft `fail_job` mit `now + retryDelayMs`; Route ohne/mit falschem Secret → 401, ohne `CRON_SECRET` → 500; Digest zweimal am selben Tag → genau ein `sendEmail`; Versandfehler → Zeile gelöscht und Fehler weitergeworfen.

**Muss rot werden:** Ohne `skip locked` hängt bzw. scheitert der dblink-Test (Timeout per `lock_timeout`). Ohne die Grenze `attempts >= 5` wird der Failed-Test rot. Ohne `on conflict` wird der Digest-Doppeltest rot. Ohne die Secret-Prüfung wird der 401-Test rot.

- [x] Commit `feat(jobs): queue with skip-locked claim, backoff, pg_cron trigger, daily-digest`

### M5: KI-Schicht

**Files:** `apps/web/lib/ai/{generate-structured.ts,providers/anthropic.ts,providers/openai-compatible.ts,cost.ts}`, Tests.

**Interfaces:**
- `generateStructured<S extends z.ZodType>({ schema, prompt, model?, system? }): Promise<z.infer<S>>`. Default-Modell aus `AI_MODEL`, Anbieter aus `AI_PROVIDER` (`anthropic` | `openai-compatible`, mit `AI_BASE_URL`; damit gehen auch OpenAI, Mistral, OpenRouter und Ollama).
- Provider-Vertrag: `complete({ model, system, prompt, jsonSchema }): Promise<{ text: string; tokensIn: number; tokensOut: number }>`. Das JSON-Schema kommt aus `z.toJSONSchema(schema)`.
- Cache-Key: `sha256(model + '\n' + JSON.stringify(jsonSchema) + '\n' + system + '\n' + prompt)`. Treffer → Ergebnis aus `ai_cache`, `ai_calls` mit `cache_hit=true`, Tokens 0, Kosten 0.
- Ergebnis prüfen: `JSON.parse` + `safeParse`. Beim ersten Fehler ein zweiter Versuch mit angehängter Fehlermeldung, beim zweiten Fehler `throw new AiSchemaError(issues)`. Jeder Provider-Aufruf erzeugt eine `ai_calls`-Zeile. Nur erfolgreiche Ergebnisse landen im Cache.
- `costEur(model, tokensIn, tokensOut): number | null` aus `studio.ai.prices`.

**Tests (Provider gemockt):** Kostenberechnung; Cache-Treffer → kein Provider-Aufruf und eine Log-Zeile mit `cache_hit`; Schema-Fehler, dann Erfolg → 2 Aufrufe, 2 Logs; zweimal Fehler → `AiSchemaError`, kein Cache-Eintrag; unbekanntes Modell → `cost_eur null`.
**Muss rot werden:** Ohne Cache-Lookup wird der Test „kein Provider-Aufruf“ rot. Ohne Retry-Grenze wird der Test „AiSchemaError nach 2 Aufrufen“ rot.

- [x] Commit `feat(ai): generateStructured with cache, cost logging, schema retry`

### M6: Marketing und Recht

**Files:** `app/(marketing)/page.tsx` (Landing anpassen), `app/(marketing)/pricing/page.tsx`, `app/(marketing)/_components/waitlist-form.tsx` + Server Action, `app/(marketing)/(legal)/{impressum,datenschutz,kuendigen}/page.tsx`, `app/opengraph-image.tsx` (`next/og`), Sitemap-Route erweitern, `components/analytics.tsx`.

**Verhalten:**
- Warteliste: Zod-E-Mail-Validierung, Insert per Admin-Client mit `on conflict do nothing`. Die Antwort ist immer gleich, damit sich nicht erfragen lässt, ob eine Adresse eingetragen ist.
- Impressum und Datenschutz lesen `studio.legal` (Env `LEGAL_NAME, LEGAL_STREET, LEGAL_ZIP_CITY, LEGAL_EMAIL, LEGAL_PHONE, LEGAL_VAT_ID, LEGAL_RESPONSIBLE`). Fehlt ein Pflichtwert, sieht man im Build eine Warnung und auf der Seite einen sichtbaren Platzhalter.
- Analytics: `NEXT_PUBLIC_ANALYTICS_PROVIDER = plausible | umami | off` (Default `off`). Das Script wird nur geladen, wenn der Schalter gesetzt ist.

**Tests:** Waitlist-Action mit ungültiger Mail → Fehler, ohne DB-Aufruf; Analytics-Komponente rendert bei `off` nichts.

- [x] Commit `feat(marketing): pricing, waitlist, legal pages from env, og image, analytics switch`

### M7: Betrieb

**Files:** `instrumentation.ts`, `sentry.*.config.ts`, `app/api/health/route.ts`, `app/admin/{layout.tsx,page.tsx}`, `lib/admin/metrics.ts`.

**Verhalten:**
- Sentry ist nur aktiv, wenn `SENTRY_DSN` gesetzt ist (EU-Region `de.sentry.io` empfohlen, in der README).
- `/api/health`: `{ ok, db: 'ok'|'down', version }`, 200 oder 503. Die DB wird mit einem leichten Select geprüft. Keine Secrets in der Antwort.
- `/admin`: `requireUser`, E-Mail (case-insensitive) in `ADMIN_EMAILS` (kommasepariert), sonst `notFound()`. Zeigt: Anmeldungen (gesamt/30 Tage), aktive Abos, MRR (A4), KI-Kosten 30 Tage (+ Anzahl unbepreister Aufrufe), fehlgeschlagene Jobs (letzte 20 mit `last_error`).

**Tests:** `isAdmin(email, list)` (Groß/Klein, Leerzeichen, leere Liste → niemand); `computeMrr`.
**Muss rot werden:** Behandelt `isAdmin` eine leere Liste als „alle“, wird der Test rot.

- [x] Commit `feat(ops): sentry, health endpoint, admin dashboard`

### M8: Bootstrap `pnpm studio:new <name>`, AGENTS.md, Skills

**Files:** `tooling/scripts/src/studio-new.mjs` (Node, keine Abhängigkeiten; ruft die CLIs `supabase` und `vercel` sowie die Supabase Management API per `fetch` auf), `AGENTS.md`, `CLAUDE.md` (Verweis), `.claude/skills/{add-paid-feature,add-cron-job,add-email-template,add-ai-task}/SKILL.md`, README.

**Ablauf (jeder Schritt prüft zuerst, ob er schon erledigt ist, damit ein erneuter Aufruf möglich ist; Zeitstempel pro Schritt):**
1. Name prüfen `^[a-z][a-z0-9-]{2,39}$`, Zielordner darf nicht existieren. Nötige Env prüfen: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ORG_ID`, `VERCEL_TOKEN`, optional `RESEND_API_KEY`.
2. `git archive HEAD` → `../<name>`, `git init`, Commit.
3. `supabase projects create --region eu-central-1` mit generiertem DB-Passwort, warten bis die Instanz healthy ist, `link`, `db push`, API-Keys holen.
4. `vercel link --yes`, Env setzen (`vercel env add` für production und preview), `vercel deploy --prod` → URL.
5. Management API: Auth `site_url`/Redirect-URLs auf die URL setzen, SMTP über Resend (falls Key vorhanden), Vault-Secrets `worker_url` und `cron_secret`.
6. `.env.local` schreiben (ohne Shared-Werte).
7. Checkliste ausgeben: Stripe-Konto/Produkte/Preise → Env; Webhook-Endpoint `https://<url>/api/billing/webhook` + Secret; Resend-Domain + DNS; Google-OAuth-Redirect-URI; Domain verbinden; AGB/Widerruf. Danach die gemessene Gesamtzeit.

**AGENTS.md:** Architekturkarte (Ordner → Verantwortung), Befehle, Konventionen (RLS-Pflicht, Migrationen, Service-Role nur in `lib/*` server-only, Tests pro Schutzfunktion), „So baust du ein bezahltes Feature“ (Produkt in `studio.config.ts` → Price-Env → `requireEntitlement` → Test).

**Tests:** `validateName` und die Funktion, die die Checkliste erzeugt. Die CLI-Aufrufe testet der Dummy-Durchlauf in M9.

- [x] Commit `feat(bootstrap): studio:new script, AGENTS.md, skills`

### M9: E2E-Smoke und Dummy-Durchlauf

**Files:** `apps/e2e/tests/billing/checkout.spec.ts`, Root-Skript `test:e2e`, `docs/dummy-run.md`.

**Ablauf des Smoke-Tests:** Anmelden per Magic Link (Mailpit-Helper aus dem Kit) → `/home/pro` leitet auf `/pricing` → Checkout → auf der gehosteten Stripe-Seite Karte `4242 4242 4242 4242` eingeben → zurück → den Zustand pollen, bis `/home/pro` den Inhalt zeigt (Webhook per `stripe listen --forward-to localhost:3000/api/billing/webhook`).

- [ ] Smoke grün; danach `pnpm studio:new test-dummy` ausführen, gemessene Zeiten pro Schritt in `docs/dummy-run.md` notieren.
- [x] Gesamt-Review des Zweigs (stärkstes Modell), Ledger-Summe melden.
- [ ] Commit `test(e2e): checkout smoke` (erledigt 443bcda, Lauf offen); `docs: dummy run` offen

## Ausführung

Subagenten nach den Regeln aus deiner CLAUDE.md: eigenes Review nur für M2, M4 und M7 (Zahlung, Zustand, Auth). M3 und M6 laufen gebündelt in einem Auftrag. M0 und M8/M9 mache ich selbst, weil sie interaktiv mit CLIs und Konten arbeiten. Dauer und Tokens pro Task stehen in `docs/ledger.md`.
