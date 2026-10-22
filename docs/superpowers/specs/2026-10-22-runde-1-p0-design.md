# Runde 1 (P0) – Design

Stand 2026-10-22. Grundlage: [Evaluation](../../evaluation-2026-10-22.md). Abschnitte 1–3 vom Nutzer einzeln
freigegeben, danach „mach mit allem weiter“: Abschnitte 4–5 sind meine Entscheidungen (unten begründet).

Ziel der Runde: messbarer Maßstab + die vier P0-Lücken schließen.

| # | Baustein | Messbares Ergebnis |
| --- | --- | --- |
| 1 | `pnpm studio:audit <url>` + `docs/quality-bar.md` | Maßstab für alle weiteren Runden |
| 2 | Inhalt/Branding aus der Config, Aufräumen | 0 Treffer „Makerkit/Placeholder/Lorem“, ehrliche FAQ |
| 3 | Security-Header | alle Header vorhanden, Header-Test grün |
| 4 | Env-Validierung | Produktions-Build bricht mit klarer Liste ab, wenn Pflichtwerte fehlen |
| 5 | Stripe automatisch in `studio:new` | 0 manuelle Stripe-Schritte |

## 1. Audit

`tooling/scripts/src/studio-audit.mjs <url>`, Befehl `pnpm studio:audit <url>`; Exit-Code ≠ 0, wenn ein harter
Grenzwert verfehlt wird. Grenzwerte in `tooling/scripts/src/quality-bar.json`, erklärt in `docs/quality-bar.md`.

- **Lighthouse** (`pnpm dlx lighthouse@12`, lokales Chrome, headless) mobil + desktop für `/`, `/pricing`,
  `/auth/sign-in`: Performance ≥ 90 mobil / ≥ 98 desktop, Accessibility = 100, SEO = 100, Best Practices ≥ 95,
  LCP mobil < 2500 ms, Script-Transfer pro Seite < 350 KB.
- **Header** auf `/`: `content-security-policy` mit `frame-ancestors 'none'`, `x-content-type-options: nosniff`,
  `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy`, `strict-transport-security`.
  `access-control-allow-origin: *` = Warnung (nicht hart), weil Vercel ihn auf gecachten öffentlichen Seiten setzt.
- **SEO** je Seite: `<title>`, `meta description`, `link rel=canonical` (= Seiten-URL), `og:url` (= Seiten-URL),
  `link rel=manifest`; `/sitemap.xml` enthält nur URLs der geprüften Origin.
- **Inhalt**: HTML von `/`, `/pricing`, `/faq`, `/auth/sign-in` ohne `Makerkit|Placeholder|Lorem` (case-insensitive).
- **Robustheit**: `/gibt-es-nicht` → 404 mit eigenem Inhalt; `POST /api/billing/webhook` ohne Signatur → 400;
  `GET /api/jobs/worker` ohne Token → 401; `/api/health` → 200 mit nicht-leerer `version`.
- Ausgabe: Tabelle (Prüfung, Ist, Soll, ✓/✗) + JSON nach `<cwd>/.studio/audits/<host>-<zeit>.json`.
- Reine Bewertungslogik (`evaluate(results, bar)`, HTML-Prüfungen) in `studio-audit-lib.mjs`, getestet; I/O nur im
  Hauptskript. Nicht Teil von `pnpm check` (braucht Live-URL); `studio:new` ruft es am Ende auf (nicht fatal).

## 2. Inhalt und Branding

- `config/studio.config.ts` bekommt `site`: `tagline`, `description`, `hero { title, subtitle, cta }`,
  `features[] { title, description }`, `faq[] { question, answer }`. Name bleibt `NEXT_PUBLIC_PRODUCT_NAME`
  (setzt `studio:new`). Standardtexte sind neutral und **wahr für jedes Produkt aus dem Template** (EU-Hosting,
  jederzeit kündbar über das Kundenportal, Zahlarten = Stripe Checkout, Rechnungen im Portal). Kein Testzeitraum,
  kein PayPal, kein Rabatt.
- `app.config.ts` liest `title`/`description` aus `site` statt aus `NEXT_PUBLIC_SITE_TITLE`/`_DESCRIPTION`.
  Die Makerkit-Werte in der committeten `apps/web/.env` (für den Agenten gesperrt) sind dann wirkungslos; der Nutzer
  löscht die zwei Zeilen selbst (Befehl im Bericht).
- Landing rendert Hero + Features aus `site`. `/faq` rendert aus `site.faq`; leer → `notFound()`, fehlt in Sitemap
  und Navigation. JSON-LD mit `<` escaped.
- Metadaten pro Seite (`/`, `/pricing`, `/faq`, Auth-Seiten): eigener Titel, `alternates.canonical`, `openGraph.url`
  (Helper `pageMetadata(path, title?, description?)`).
- `app/manifest.ts` aus Config; `app/icon.tsx` + `app/apple-icon.tsx` per `ImageResponse` (Monogramm aus dem
  Produktnamen) statt Favicon-Dateien.
- Löschen: Demo-Dashboard (`app/home/_components/dashboard-demo*.tsx` → schlichter Willkommensblock mit
  Abo-Status und Link zu Billing), `public/images/*` außer `oauth/`, `@makerkit/data-loader-*`,
  Makerkit-Teil der README (kurzer Abschnitt „Basis: Makerkit lite, MIT“ bleibt), `.github`-Issue-Links auf
  makerkit.dev, Makerkit in Betreffzeilen der lokalen `supabase/config.toml`.
- Gate: Vitest prüft `site` (keine Platzhalter, `faq`-Antworten ohne „trial|PayPal|discount“ solange das Billing
  das nicht kann); Audit prüft live.

## 3. Security-Header

- `apps/web/config/security-headers.mjs`: `securityHeaders({ supabaseUrl, sentryDsn, analyticsSrc, isDev })`
  → `{ key, value }[]`, eingebunden über `headers()` in `next.config.mjs` für `/:path*`.
- CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (+ Analytics-Host; `'unsafe-eval'` nur dev);
  `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:` + Supabase; `font-src 'self' data:`;
  `connect-src 'self'` + Supabase https/wss + Sentry-Ingest + Analytics-Host; `frame-src` Stripe-Hosts nicht nötig
  (Checkout per Redirect); `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'`;
  `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`; `upgrade-insecure-requests` (nicht dev).
  `shortcut: kein Nonce (würde jede Seite dynamisch machen), nachrüsten sobald ein Produkt Nutzer-HTML rendert`.
- Dazu `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`,
  `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY`; `poweredByHeader: false`.
- Einführung: erst `Content-Security-Policy-Report-Only` auf dem Dummy (Schalter `CSP_REPORT_ONLY=true`),
  Seiten inkl. Stripe-Checkout/Portal durchklicken, Konsole prüfen, dann scharf.
- Test: Vitest auf `securityHeaders()` – wird rot, wenn `frame-ancestors 'none'`, `nosniff` oder `object-src 'none'`
  fehlen oder `unsafe-eval` in Produktion auftaucht; Hosts nur, wenn konfiguriert.

## 4. Env-Validierung (Entscheidung)

Prüfung beim **Produktions-Build**, nicht beim Start: Ein fehlgeschlagener Vercel-Build lässt die alte Version
live, ein Absturz beim Start legt die Seite lahm. Vercel stellt die Projekt-Env auch im Build bereit.

- `apps/web/config/env.mjs`: `checkEnv(env, productKeys) → { errors: string[], warnings: string[] }`, nur
  Variablennamen + Hinweis in den Meldungen, **nie Werte**.
- `next.config.mjs` exportiert eine Funktion `(phase) => …`; bei `PHASE_PRODUCTION_BUILD` und
  `NODE_ENV !== 'test'` (also nicht `build:test`) → Fehler: Abbruch mit Liste + Verweis auf `.env.example`;
  Warnungen: Log.
- Fehler: `NEXT_PUBLIC_SITE_URL` (https, nicht localhost), `NEXT_PUBLIC_SUPABASE_URL` (URL),
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (≥ 32 Zeichen), `RESEND_API_KEY`
  (`re_…`), `EMAIL_FROM`; wenn `STRIPE_SECRET_KEY` gesetzt: Format `sk_|rk_` + `STRIPE_WEBHOOK_SECRET` (`whsec_…`)
  + `STRIPE_PRICE_<KEY>` (`price_…`) je Produkt; Analytics-Provider gesetzt → zugehörige Pflichtwerte.
- Warnungen: kein `STRIPE_SECRET_KEY` (Billing aus), KI-Provider ohne Key, `LEGAL_*` unvollständig, kein `ADMIN_EMAILS`.
- `/api/health`: `version` = Commit-SHA, sonst `VERCEL_DEPLOYMENT_ID`, sonst `dev` (heute leer bei CLI-Deploys,
  weil Vercel `VERCEL_GIT_COMMIT_SHA=""` setzt).

## 5. Stripe in `studio:new` (Entscheidung)

Voraussetzung: `STRIPE_SECRET_KEY` (Test, `sk_test_`/`rk_test_`) in `.env.shared`. Fehlt er, wird der Schritt
übersprungen und die Checkliste nennt die manuellen Schritte wie bisher. Live-Keys (`sk_live_`) lehnt `studio:new`
ab – Live-Umstellung gehört zu `studio:launch` (Backlog).

- Produktdaten wandern nach `apps/web/config/billing.json`:
  `{ "webhookEvents": [...], "products": { "<key>": { name, mode, priceMonthlyEur? | priceEur? } } }`.
  `studio.config.ts` liest daraus und setzt `priceId` aus `STRIPE_PRICE_<KEY>`; das Skript liest dieselbe Datei.
  Abo braucht `priceMonthlyEur`, Einmalkauf `priceEur` (Zod).
- Schritt „Stripe einrichten“ vor dem Deploy (mit der vorläufigen Site-URL), über die Stripe-REST-API per `fetch`
  (form-encoded, kein SDK im Skript), idempotent:
  - Produkt je Key: Suche `metadata['studio_project']` + `metadata['studio_product']`, sonst anlegen.
  - Preis je Produkt mit `lookup_key` `<projekt>_<key>_<betrag>`: vorhanden → wiederverwenden, sonst anlegen
    (EUR, monatlich bei Abo).
  - Webhook-Endpoint `<siteUrl>/api/billing/webhook` mit `webhookEvents`, Metadaten `studio_project`;
    Secret steht nur in der Anlage-Antwort → in `.studio/state.json` (0600, gitignored). Endpoint vorhanden, aber
    Secret nicht im State → löschen und neu anlegen.
  - Kundenportal-Konfiguration (Rechnungen, Zahlungsmethode, Kündigung zum Periodenende, Return-URL
    `/home/billing`) → neue Variable `STRIPE_PORTAL_CONFIGURATION` (`bpc_…`), `openPortal` übergibt sie.
  - Vercel-Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_<KEY>`, `STRIPE_PORTAL_CONFIGURATION`;
    `.env.local`: dieselben außer Webhook-Secret (lokal aus `stripe listen`).
- `verifySiteUrl`: ändert sich die URL, wird auch die Webhook-URL aktualisiert (Secret bleibt).
- Checkliste: Stripe-Punkte entfallen, wenn der Schritt lief.
- Test: reine Funktionen (Request-Bodies, Lookup-Key, Event-Liste) in `studio-new-lib.mjs`; Route-Test prüft, dass
  jedes Event aus `billing.json` von der Webhook-Route verarbeitet wird.

## Abschluss der Runde

`pnpm check` grün → Änderungen auf den Dummy (`../test-dummy`) übertragen und deployen → Audit vorher/nachher →
externer Review (frischer Agent, anderes Modell, Rollen Security + Solo-Gründer) → Ledger → Bericht.

## Abweichungen bei der Umsetzung

- Seitentexte liegen in `config/site.config.ts` statt in einem `site`-Block von `studio.config.ts`: `app.config.ts`
  wird auch im Browser importiert, `studio.config.ts` enthält Server-Env (Preis-IDs).
- Produkte liegen in `config/billing.json` (von `studio.config.ts` und `studio-new.mjs` gemeinsam gelesen).
- Header- und Env-Module sind TypeScript (`config/security-headers.ts`, `config/env-check.ts`, `next.config.ts`)
  statt `.mjs`; Tests entsprechend `*.test.ts`.
- Zod läuft im Browser `jitless` (`instrumentation-client.ts`), sonst meldet die CSP ohne `'unsafe-eval'` die
  `new Function`-Probe von Zod als Verstoß.
