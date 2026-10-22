# Evaluation studio-template vs. Premium-Industriestandard (2026-10-22)

Ziel: das optimale Template für einen Solo-Gründer, der viele kleine SaaS-Produkte baut.
Methode nach Rieseberg („How to be more ambitious“): **Höhe** (Ergebnis statt Aufgabe: „Idee → zahlender Nutzer“),
**Tiefe** (Messungen statt Meinungen), **Breite** (mehrere Fachperspektiven + Red Team), **externer Richter**
(nie das eigene Werk selbst bewerten).

Grundlagen: Live-Audit des Dummys (Lighthouse 12, Header, SEO, Fehlerverhalten; Rohdaten im Scratchpad),
[UI-Analyse](ui-analyse.md) (24 Seiten von supastarter, Linear, Vercel, Resend), Marktrecherche (next-forge,
Makerkit Pro, supastarter, ShipFast, create-t3-app, Vercel Marketplace), [Probelauf](dummy-run.md).

## Scorecard

Skala 0–5 (5 = besser als jedes untersuchte Kit). Ziel = Premium-Niveau.

| Bereich | Ist | Ziel | Beleg |
| --- | --- | --- | --- |
| Setup pro Projekt | 3 | 5 | 1 Befehl (~9 min), danach ~10 manuelle Stripe-Schritte und ~4 für die Resend-Domain. Kein untersuchtes Kit kommt mit einem Befehl live – hier können wir führen |
| Erst-Setup (einmalig) | 2 | 4 | ~15 Schritte: Tokens in 3 Dashboards, ~12 einzelne `dotenvx set`-Befehle mit langem Pfad, keine Live-Prüfung der Tokens |
| Design/UI | 1 | 4 | Flaches Theme ohne Akzent, Text-Hero, Platzhalter-Features, Pricing als einzelne Karte, Auth mit zwei gestapelten E-Mail-Feldern |
| Inhalt/Branding | 0 | 4 | Titel/Description/OG auf `/` und `/pricing` = Makerkit-Werbetext; `/faq` mit **falschen Versprechen** (14 Tage Test, PayPal, 50 % Rabatt) – abmahnfähig; Landing „Placeholder copy“; README-Hälfte ist Makerkit-Werbung; Favicons/Manifest Makerkit |
| Performance | 3 | 5 | Desktop 100/100/100; Mobil 84–89, LCP 3,8–4,4 s (Ziel < 2,5 s), JS 505–530 KB je Seite, CLS 0 |
| Barrierefreiheit | 4 | 5 | Lighthouse 96–100; offen: 2× Touch-Ziel zu klein (`/`), 1× Passwortfeld ohne Label, fehlende `autocomplete`, 4× falsches `<label for>` |
| Sicherheit | 3 | 5 | Stark: RLS überall + pgTAP, Webhook-Signatur (400), Worker-Token (401), Admin nur bestätigte Allowlist, Open-Redirect-Schutz. Schwach: nur HSTS – kein CSP/`frame-ancestors`, `nosniff`, Referrer-/Permissions-Policy; `access-control-allow-origin: *` auf Seiten; kein Rate-Limit für öffentliche Formulare |
| SEO | 2 | 5 | robots/sitemap korrekt; Makerkit-Meta, kein Canonical, kein Manifest, `og:url` von `/pricing` zeigt auf `/` |
| Billing | 4 | 5 | Live-Testkauf end-to-end ok (Webhook idempotent, Entitlement aktiv); fehlt: Jahres-Toggle, mehrere Pläne im UI, automatisches Stripe-Setup |
| E-Mail | 3 | 5 | Versand über Resend ok, Kit-Templates jetzt hochgeladen; ohne verifizierte Domain gehen Mails nur an die eigene Adresse |
| Jobs/KI/Admin | 4 | 5 | Queue + pg_cron + Fallback, KI-Kosten-Tracking, Admin-Metriken; fehlt Nutzerliste (beschlossen) |
| Tests/CI | 4 | 5 | `pnpm check` (Typen, Lint, Format, Vitest, pgTAP, Build) als pre-push; CI nur Typecheck/Lint/Test; keine Performance-/Header-/Branding-Gates |
| Fehlerseiten/Robustheit | 2 | 4 | 404 = generische Next-Seite; keine Env-Validierung (fehlende Variable fällt erst zur Laufzeit auf); `/api/health` liefert leere `version` |
| Agent-Readiness | 4 | 5 | AGENTS.md + 4 Skills; fehlt `llms.txt`, Doctor-Befehl, maschinenlesbare Qualitätsziele |
| Wartbarkeit | 3 | 4 | ~21k LOC Kit-Pakete vs. ~11k eigene; ungenutzte Abhängigkeiten (`@makerkit/data-loader-*`, vermutlich weitere); Upstream-Updates von Makerkit nicht mehr sinnvoll übernehmbar – eigener Pfad nötig |

## Verbesserungen, priorisiert

**P0 – vor dem ersten echten Produkt**
1. **Inhalt und Branding aus der Config:** Titel, Description, OG, FAQ, Hero, Features aus `studio.config.ts`;
   falsche FAQ-Versprechen raus; Makerkit-Meta, -README-Teil, -Favicons, -Manifest, Demo-Dashboard, tote Bilder und
   Pakete entfernen. CI-Gate: Build schlägt fehl, wenn „Makerkit“ oder „Placeholder“ in ausgelieferten Seiten steht.
2. **Security-Header:** CSP (mit Nonce oder strikt ohne `unsafe-eval`), `frame-ancestors 'none'`, `nosniff`,
   Referrer-Policy, Permissions-Policy, COOP; `ACAO: *` entfernen. Header-Check als Test.
3. **Env-Validierung:** ein Zod-Schema, Build/Start bricht mit klarer Meldung ab, wenn Pflichtwerte fehlen.
4. **Stripe vollautomatisch in `studio:new`:** Produkte/Preise aus `studio.config.ts`, Webhook-Endpoint
   (Secret aus der API-Antwort), Kundenportal-Konfiguration, Vercel-Env, Redeploy → **0 manuelle Stripe-Schritte**.

**P1 – Premium-Niveau**
5. **Erst-Setup als Assistent** `pnpm studio:setup`: fragt jeden Wert ab, öffnet die Token-Seite, prüft live
   (Supabase/Vercel/Resend/Stripe), schreibt verschlüsselt; dazu `pnpm studio:doctor` (prüft lokal und ein Live-Projekt).
6. **UI-Überarbeitung** nach [ui-analyse.md](ui-analyse.md) (Ansatz A, shadcn-Blocks), inkl. Onboarding-Schritt,
   Kontaktformular, Admin-Nutzerliste, eigene 404-/Fehlerseiten.
7. **Resend-Domain automatisch:** Domain anlegen, DNS-Records setzen (Vercel DNS API, falls die Domain dort liegt),
   verifizieren, `EMAIL_FROM` setzen.
8. **Mobile Performance:** LCP < 2,5 s, JS-Budget pro Seite (Ziel < 300 KB), Bundle-Analyse, Fonts/Preloads.
9. **SEO-Feinschliff:** Canonical, Manifest, Meta/OG pro Seite, `og:url` korrekt.
10. **Rate-Limit/Captcha** für öffentliche Formulare (Warteliste, Kontakt) – Turnstile ist im Kit schon angelegt.

**P2 – Kür**
11. Passkeys (falls Supabase Auth es stabil anbietet – zu prüfen), `llms.txt`, Version in `/api/health`,
    Abhängigkeits-Diät, eigener Update-Pfad (Template → bestehende Projekte).

## Vorschlag: Verbesserungsschleife

1. **Qualitätsziele maschinenlesbar** in `docs/quality-bar.md` + Befehl `pnpm studio:audit`, der gegen ein Live-
   Projekt misst: Lighthouse mobil/desktop (Grenzwerte), Header, SEO-Basics, Branding-Grep, a11y-Fehler = 0,
   Setup-Schritte und -Zeit aus dem `studio:new`-Log.
2. **Zyklus:** Audit → die 3 größten Lücken → kleiner Plan → umsetzen (TDD) → `pnpm check` → neues Dummy-Deploy →
   Audit erneut → **externer Review** durch einen frischen Agenten mit anderem Modell und Rollen-Fokus (Designer,
   Security, Solo-Gründer beim Setup, Endkunde, Red Team) → Ledger-Eintrag mit Messwerten vorher/nachher.
3. **Abbruch:** alle harten Ziele erfüllt und zwei Reviews in Folge ohne Befund „hoch“ oder „mittel“.
4. **Höhe:** am Ende ein echter Test mit einem neuen Produkt: Idee → live mit Zahlung, Zeit gestoppt.

## Entscheidungen (2026-10-22)

- Stripe: **ein Konto für alle Produkte**; `studio:new` legt Produkte/Preise/Webhook pro Projekt an, mit Projektname
  als Metadatum. Voraussetzung: Stripe-Secret-Key (Test) in `.env.shared`.
- Reihenfolge: **P0 zuerst**, dann UI (Ansatz A: shadcn direkt, Kit-Auth-Logik bleibt).
- Schleife: **Runde für Runde** mit Bericht (Messwerte vorher/nachher); nächste Runde nach Freigabe.
- Extras für die UI-Runde: Onboarding-Schritt, Kontaktformular, Admin-Nutzerliste.

## Backlog

- **`pnpm studio:launch <projekt> <domain>`** – vor dem ersten echten Launch: Domain an Vercel, Resend-Domain
  anlegen, DNS automatisch (Vercel DNS) oder als Liste (externer Registrar), Verifizierung prüfen, `EMAIL_FROM` und
  Site-URL (Supabase Auth, Stripe-Webhook, Vault) umstellen. Aktuell keine Domains vorhanden.
- Lokaler E2E-Billing-Smoke (`E2E_BILLING=true`).
- Schlankerer Supabase-Token mit Ablaufdatum ([dummy-run.md](dummy-run.md)).
- `braces` < 3.0.4 (via next-sitemap, nur Build) – sobald ein Fix erscheint.
