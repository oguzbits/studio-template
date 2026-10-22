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
