# Ledger – Plan 2026-10-22-studio-template

| Meilenstein | Ausführung | Dauer | Subagent-Tokens | Notiz |
|---|---|---|---|---|
| M0 Basis + Hooks | selbst | ~70 min | – | ~40 min davon Docker-Image-Pull + Port-Konflikt |
| M1 DB-Fundament | selbst | ~15 min | – | pgTAP-Red-Check gemacht |
| M2 Billing | Subagent opus | ~15 min | 152k | inkl. Fix-Runde; + Research-Agent (haiku) 61k, 2 min |
| M2 Review | Subagent sonnet | ~1.5 min | 68k | nichts Kritisches; 3 Fixes + Testlücken |
| M3+M6 E-Mail, Marketing | Subagent sonnet | ~7 min | 113k | react-email statt deprecated @react-email/components |
| M2 Review-Fixes | Subagent opus (fortgesetzt) | ~3 min | 173k (kumulierter Kontext) | 5 Fixes, 11 Tests |
| M4 Jobs | Subagent opus | ~10 min | 133k | pg_cron/pg_net/dblink lokal ok; 4 Guard-Checks rot |
| M4 Review | Subagent sonnet | ~1 min | 59k | 1 bestätigter Endlos-Reclaim-Bug + 5 weitere |
| M5 KI-Schicht | Subagent sonnet | ~2 min | 118k | claude-haiku-5-5 Default; gpt-4o-mini-Preis ungeprüft |
| M4 Review-Fixes | Subagent opus (fortgesetzt) | ~4 min | 161k (kumulierter Kontext) | 7 Fixes, pgTAP 41, Vitest 93; leere Digest-Liste schreibt keinen Marker |
| M8 Bootstrap, AGENTS.md, Skills | Hauptsession | ~25 min | – | studio:new nur Dry-Run geprüft; echte Läufe in M9 |
| M7 Betrieb | Subagent sonnet | ~5 min | 84k | Sentry 10.76.1 ohne withSentryConfig; @sentry/cli-Build aus |
| M7 Review | Subagent sonnet | ~1 min | 59k | 1 wichtig (unbestätigte Admin-Mail), 6 minor |
| M7 Review-Fixes + E2E-Spec | Hauptsession | ~10 min | – | requireAdmin liest auth.users frisch; Trials nicht in MRR |
| supastarter-Abgleich | Subagent researcher (haiku) | ~1.5 min | 28k | 1 echter Fund: Open Redirect im Kit (behoben) |
| Gesamt-Review | Subagent opus (nach Limit fortgesetzt) | ~2 min | 136k | 5 wichtig (Daily-Fallback, Redirect-Bypass, Vercel-Upload, URL geraten, EMAIL_FROM), alle behoben |
| Review-Fixes | Hauptsession | ~15 min | – | pgTAP 50, Vitest Callback 8 |
| M9 Probelauf (6 Versuche) | Hauptsession | ~45 min Wanduhr | – | netto ~9 min; 4 Skript-Fixes, Next-Sicherheitsupdate, turbo `LEGAL_*` |
| **Summe Subagenten** | | ~65 min | ~1,66 Mio. | ohne Hauptsession |

## Runde 1 (P0) – 2026-10-22

| Task | Ausführung | Dauer | Tokens | Notiz |
| --- | --- | --- | --- | --- |
| Spec + Plan | Hauptsession | – | – | 5 Bausteine; 4 und 5 selbst entschieden |
| T1 Audit-Werkzeug | Hauptsession | – | – | Baseline 35/75 |
| T2 Inhalt/Branding | Hauptsession | – | – | site.config.ts, pageMetadata, Icons/Manifest, Makerkit-Reste raus |
| T3+T4 Header, Env-Check | Hauptsession | – | – | statische CSP (PPR), Build bricht bei fehlender Env |
| T5 Stripe in studio:new | Hauptsession | – | – | nur Dry-Run; Live-Test braucht `STRIPE_SECRET_KEY` (Test) |
| T6 Deploy, CSP-Probe, Audit | Hauptsession | – | – | Zod-Eval-Probe gefunden und behoben; Audit 60/75 |
| Externer Review | Subagent sonnet | ~1.5 min | 85k | 1 hoch, 6 mittel, Rest niedrig |
| Review-Fixes | Hauptsession | ~10 min | – | alle hoch/mittel behoben; offen: Umami-connect-src ungeprüft, studio:new-Wiederaufnahme ohne Test |
| Stripe live (test-dummy, Testmodus) | studio:new Wiederaufnahme | 0.9 min | – | Produkt, Preis 9 €/Monat, Webhook (API 2026-09-30.endive, 5 Events), Portal angelegt; Redeploy, Schnell-Audit 39/39 |
| Live-Test durch Nutzer | Hauptsession | ~15 min | – | 2 echte Fehler: Supabase-Mail-Limit 2/h trotz Resend-SMTP (studio:new setzt jetzt 30/h); Portal-Kündigung via `cancel_at` blieb `active` (Webhook behoben, 2 Tests). Ohne Resend-Domain keine Fremd-Registrierung (P1: Hinweis in UI und studio:new) |

## Runde 2a (P1) – 2026-10-22/23

| Task | Ausführung | Dauer | Tokens | Notiz |
| --- | --- | --- | --- | --- |
| Spec + Plan | Hauptsession | – | – | 2a/2b-Schnitt; Resend-Domain-Automatik → studio:launch |
| T1–4 Setup, Doctor, Resend-Hinweis, Rate-Limit | Subagent sonnet | 4.5 min | 101k | gebündelt, ein Kaltstart |
| T1–4 Fixes | Subagent sonnet (fortgesetzt) | 1 min | ~111k (kumuliert) | nach T5 nachgezogen |
| T1–4 Review | Subagent sonnet | – | 77k | |
| T5 Mobile-Performance | Subagent opus | 2.2 min | 70k | AuthProvider aus Root, Sentry dynamisch, Hero ohne Fade |
| T5 Review | Subagent sonnet | 36 s | 61k | |
| T6 Deploy + Audit | Hauptsession, Deploy durch Nutzer | – | – | Audit 61/75 (vorher 60/75); `/` mobil 83→95 |
| Gesamt-Review | Subagent opus | 4.4 min | 129k | Fix-Welle: AuthGate-Suspense, Admin-AuthProvider, Setup-EOF |
| Fix-Welle | Subagent sonnet | 1.2 min | 64k | Rest (EOF vor erster Frage) selbst behoben |
| Nachentscheidung | Hauptsession | – | – | LEGAL_*/ADMIN_EMAILS/ANTHROPIC_API_KEY: `'warn'` statt Pflicht (wie env-check.ts) |
| **Summe Subagenten** | | ~14 min | ~0,6 Mio. | ohne Hauptsession |

## Runde 2b (UI-Look) – 2026-10-23

Spec/Plan: [spec](superpowers/specs/2026-10-23-runde-2b-ui-design.md), [plan](superpowers/plans/2026-10-23-runde-2b-ui.md). Nach Nutzerfeedback („wirkt wie AI-Slop“) Richtung gewechselt: ruhige editoriale Basis statt Dunkel-SaaS-Muster (Taste-Skill-Hausregeln + Inspector; voller Skill-Ablauf pro Produkt, nicht für die Vorlage).

| Task | Ausführung | Dauer | Tokens | Notiz |
| --- | --- | --- | --- | --- |
| Spec + Plan | Hauptsession | – | – | |
| T1+2 Theme, Configs ohne zod | Subagent sonnet | 4,8 min | 107k | Zod-Chunk auf `/` nicht gefunden |
| T3+4 Header, Landing, Pricing | Subagent sonnet | 4,3 min | 114k | später ersetzt (Slop-Muster) |
| T5+6 Auth, Shell, Fehlerseiten, Logo | Subagent sonnet | 16,5 min | 144k | E2E: 4 von 8 rot, identisch vor der Änderung |
| T7 a11y + Perf | Subagent sonnet | 19,5 min | 168k | Zod-Importer: `instrumentation-client.ts`; a11y 100; Script 222/337 KB |
| Redesign editorial | Subagent opus | 31,5 min | 180k | Newsreader + Geist, warmes Neutral, ein grüner Akzent; Inspector 0 FAIL |
| **Summe Subagenten** | | ~77 min | ~0,71 Mio. | ohne Hauptsession |

Messung lokal (Lighthouse 12, `next start`): mobil Perf 92/93/87 (`/`, `/pricing`, `/auth/sign-in`), LCP 3,2–4,1 s (Ziel < 2,5 s offen; Supabase ~68 KB und zod ~46 KB auf Sign-in), a11y 100, Script 222/222/327 KB.

### Offen / nächste Schritte

1. [x] E2E (Auth/Account, Produktions-Build): vorher 4 von 8 grün (4 rot), nachher 8 von 8 grün (zweimal hintereinander). Ursachen: (a) Profilname, E-Mail, Passwort: `Button` (Base UI) ist standardmäßig `type="button"`, die Formulare schickten nie ab – echter App-Fehler, `type="submit"` jetzt auch bei Magic-Link-Senden, MFA-Code und „Resend link“. (b) Passwort ändern: Formular nur bei `amr=password`, nach Bestätigungslink ist `amr=otp`; jetzt Prüfung auf `app_metadata.providers` mit `email`. (c) Konto löschen: Next 15+ antwortet auf Server-Action-Redirect mit 200 + `x-action-redirect` statt 303; Test prüft jetzt den Header und die Weiterleitung auf `/`. (d) Passwort-Reset: Mailpit-Löschen im Helper nutzte die falsche URL (405), die alte Bestätigungsmail blieb liegen und wurde statt der Reset-Mail geöffnet; zusätzlich Linktext „Back to home“ (2b-Text).
2. Zeile `NEXT_PUBLIC_DEFAULT_THEME_MODE` in `apps/web/.env` auf `system` stellen (Agenten dürfen die Datei nicht anfassen).
3. [x] Pricing bei 1440 px hell/dunkel und 390 px angesehen: Titelspalte unter dem Untertitel war leer (Inspector: `hero-void` WARN, `empty-screens` FAIL). Jetzt Titel und Plan-Feld bündig, bei einem Plan stehen die Features ab `lg` unter dem Titel; Inspector 0 FAIL / 0 WARN (mit den drei erlaubten Regeln). OAuth-Reihenfolge weiterhin nur per Unit-Test geprüft.
4. Push, dann Deploy auf test-dummy (durch den Nutzer) und `pnpm studio:audit`; Design-Review durch frischen Agenten, auch auf Fremd-Branding in Bildern/Logos (Text-Grep findet SVG-Pfade nicht).
5. App-Shell (`/home/*`) nach Referenz „platform.claude.com/settings/keys“ (Screenshot vom Nutzer nötig), mit Taste-Skill `references/app-screens.md`.
6. Taste-Skill pro Produkt in `AGENTS.md`/`studio:new` eintragen.
7. Danach Runde 2c (Onboarding, Kontaktformular mit `rateLimit`, Admin-Nutzerliste); Backlog: Jahres-Toggle, leichterer Supabase-Client für Mobil-LCP.

## Runde 2c (Kontakt, Admin-Nutzerliste, Onboarding) – 2026-10-23

Spec/Plan: [spec](superpowers/specs/2026-10-23-runde-2c-extras-design.md), [plan](superpowers/plans/2026-10-23-runde-2c-extras.md). Zwischendurch Session-Limit: Bündel-B-Subagent gestoppt, Weiterarbeit in der Hauptsession (die Teilarbeit war weiter, als die Übergabe notierte).

| Task | Ausführung | Dauer | Tokens | Notiz |
| --- | --- | --- | --- | --- |
| Spec + Plan | Hauptsession | – | – | |
| T1+2 Tabelle, Kontaktformular, Job, Mail | Subagent sonnet | 10,2 min | 143k | |
| T1+2 Review + Fix-Läufe | Subagent sonnet (3 Läufe) | 7,0 + 1,6 + 1,0 min | 118k + 85k + 126k (grob zugeordnet) | M1 failed≠invalid, M2 Duplikat bei Enqueue-Fehler, M3 NUL-Byte |
| T3+4 Admin-Liste, Nachrichten, Onboarding | Subagent sonnet, bei Limit gestoppt | nicht erfasst | nicht erfasst | Rest, pgTAP und E2E-Spec Onboarding in der Hauptsession |
| Gesamt-Review | Subagent opus | 1,3 min | 89k | 0 hoch, 2 mittel (IPv6-Rate-Limit → globale Kappe 30/h; Redirect im Suspense → Inhalt im Gate), 4 niedrig (Name-Fehler als Hinweis, Seitenobergrenze, 2 bewusst belassen) |

Gates: `pnpm check` grün, pgTAP 67 Tests, E2E (Produktions-Build, `--retries=0`) 11 von 11 grün (Auth, Passwort-Reset, Konto, Kontakt, Onboarding).

### Audit test-dummy nach 2b+2c (2026-10-23, `pnpm studio:audit`)

72/75 (vorher 61/75). Mobil: Perf 96 / 97 / 93 (`/`, `/pricing`, `/auth/sign-in`), a11y/Best Practices/SEO überall 100/100/100, Script 214 / 214 / 320 KB. Desktop: Perf 100, LCP 508–631 ms. Offen (hart): LCP mobil 2714 / 2585 / 3183 ms (Ziel < 2500). Weich: `Access-Control-Allow-Origin: *` auf `/`. Nächster Hebel: Sign-in (Supabase-Client ~68 KB) und Schriftladung (Newsreader-Preload) prüfen.

### Review-Runde 2 (2026-10-23)

Design-Review (live, Sonnet): 0 hoch, 2 mittel (Theme folgt nicht dem System: Env auf test-dummy; Logo-Umbruch mobil: behoben), Rest niedrig. Red-Team (opus, 98k Tokens, 3,4 min): 0 hoch, 2 mittel (Welcome-Mail/Digest an unbestätigte Nutzer: Migration `20261023100000`; IPv6-Rate-Limit nach /64: behoben), 6 niedrig (update-password-Redirect, Wartelisten-E-Mail-Länge, relativer `next`, Dateirechte 0600: behoben; `braces`-Override scheitert, Registry hat keine Version ≥ 3.0.4; `/admin` für Anonyme streamt Redirect statt 404: bewusst offen). Fix-Bündel: Subagent sonnet, 3,6 min, 79k Tokens. Gates: `pnpm check` grün, E2E 11/11. Neu: `/llms.txt`, `studio:sync`. Nach Deploy von test-dummy: Migrationen per `studio:sync --migrate`.
