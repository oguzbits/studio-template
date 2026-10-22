# Runde 2a (P1 ohne UI) – Design

Stand 2026-10-22. Grundlage: [Evaluation](../../evaluation-2026-10-22.md) P1 (Punkte 5–10) und Ledger-Notiz
„ohne Resend-Domain keine Fremd-Registrierung“. Vom Nutzer freigegeben (Zuschnitt, Entwurf).

## Zuschnitt (Entscheidungen des Nutzers)

- **2a** (diese Runde): Setup-Assistent + Doctor, Resend-Hinweis, DB-Rate-Limit, Mobile-Performance.
- **2b** (eigene Spec): UI-Überarbeitung (Punkt 6) inkl. Onboarding, Kontaktformular, Admin-Nutzerliste,
  404-/Fehlerseiten.
- **Punkt 7** (Resend-Domain automatisch) → später `studio:launch` (Backlog), weil es noch keine Domain gibt.
  Jetzt nur Hinweise.
- **Punkt 9** (SEO) ist seit Runde 1 im Audit grün → keine Arbeit, nur Bestätigung im Abschluss-Audit.
- **Spam-Schutz:** eigenes DB-Rate-Limit, kein Turnstile (keine weiteren Keys pro Projekt).

| # | Baustein | Messbares Ergebnis |
| --- | --- | --- |
| 1 | `pnpm studio:setup` | Erst-Setup ohne einen einzigen `dotenvx set`-Befehl von Hand; jeder Token live geprüft |
| 2 | `pnpm studio:doctor [url]` | ein Befehl meldet alles Fehlende/Ungültige lokal und für ein Live-Projekt |
| 3 | Resend-Hinweis | `studio:new`, Doctor und `/admin` sagen klar, wenn Fremd-Registrierung nicht geht |
| 4 | DB-Rate-Limit | Warteliste lehnt ab dem 6. Versuch pro IP/Stunde ab; Test wird rot ohne Limit |
| 5 | Mobile-Performance | LCP mobil < 2500 ms, Script-Transfer < 350 KB auf `/`, `/pricing`, `/auth/sign-in` (oder dokumentierter Rest für 2b) |

## 1. Gemeinsame Token-Prüfung

Neues Modul `tooling/scripts/src/studio-tokens.mjs` (Logik ohne Seiteneffekte, Tests in `studio-tokens.test.mjs`):

- `SHARED_KEYS`: Liste der Werte aus `.env.shared` (gleiche Reihenfolge wie das Template in `secrets-init.mjs`),
  je Eintrag `{ key, required, secret, hint, tokenUrl?, check? }`. `required` gilt für `studio:new`
  (Supabase-Token/Org, Vercel-Token, Resend-Key, `ADMIN_EMAILS`, `LEGAL_*` außer `LEGAL_PHONE`/`LEGAL_VAT_ID`);
  KI-Keys: nur der des Default-Providers. `STRIPE_SECRET_KEY` optional, aber vom Setup angeboten.
- `check(value, env, fetch)` → `{ ok: true, note? }` oder `{ ok: false, error }`, nur lesende Aufrufe:
  - Supabase: `GET /v1/organizations` (Org aus `SUPABASE_ORG_ID` sichtbar).
  - Vercel: `GET /v2/user` (+ `teamId`/`slug`, wenn `VERCEL_SCOPE` gesetzt).
  - Resend: `GET /domains`; `note` = Zahl verifizierter Domains (0 → Warnung, siehe 3).
  - Stripe: `stripeKeyError` (vorhanden) + `GET /v1/balance`.
  - Anthropic/OpenAI: `GET /v1/models`.
- `loadSharedSecrets()` und `sharedSecretsPath()` ziehen aus `studio-new.mjs` hierher um (unverändertes Verhalten);
  `studio-new.mjs` importiert sie. Der Preflight von `studio:new` bleibt, wie er ist.
- Fehlermeldungen enthalten nie den Wert, nur Key und HTTP-Status.

## 2. `pnpm studio:setup`

`tooling/scripts/src/studio-setup.mjs`. Ablauf:

1. Fehlt `.env.shared` → `secrets-init.mjs` ausführen (bestehend).
2. Für jeden Eintrag aus `SHARED_KEYS`: Wert vorhanden und `check` ok → `✓`, weiter. Sonst: Hinweis + Token-URL
   ausgeben, URL mit `open` öffnen (nur macOS; sonst nur ausgeben), Wert abfragen (`node:readline`, bei
   `secret: true` ohne Echo). Leere Eingabe bei optionalem Key → überspringen. `check` schlägt fehl → Fehler zeigen,
   erneut fragen (max. 3×, dann überspringen und am Ende melden).
3. Gültiger Wert → `dotenvx set KEY <wert> -f <shared> --no-armor` über `execFileSync` mit Argument-Array
   (Wert nie in einer Shell-Zeile, nie im Log).
4. Zusammenfassung: gesetzt / übersprungen / fehlt noch; Exit 1, wenn ein `required`-Key fehlt.

Interaktiver Teil (readline, `open`) wird nicht unit-getestet; getestet wird die Entscheidungslogik
(`nextAction(entry, value, checkResult)` → `skip | ask | ok`).

## 3. `pnpm studio:doctor [url]`

`tooling/scripts/src/studio-doctor.mjs`, Ausgabe-Konvention wie `studio:audit` (`✓`, `!` Warnung, `✗` Fehler,
Exit 1 bei Fehler).

- **Lokal:** Node ≥ Version aus `package.json` `engines`, pnpm vorhanden, Docker läuft (`docker info`),
  Supabase-CLI (`pnpm exec supabase --version`), `.env.shared` lesbar, alle `required`-Keys vorhanden und `check` ok.
- **Resend:** 0 verifizierte Domains → Warnung „Mails nur an die eigene Resend-Adresse; Fremde können sich nicht
  registrieren. Domain anlegen (später `studio:launch`).“
- **Mit `url`:** `GET <url>/api/health` = 200 mit `version`; Header-Kurzcheck über die vorhandene Audit-Lib
  (`--no-lighthouse`-Teil), damit keine Prüfung doppelt existiert.

## 4. Resend-Hinweis

- **`studio:new`:** nach dem Auth-SMTP-Schritt: keine verifizierte Resend-Domain → Warnzeile in der
  Abschluss-Checkliste (`buildChecklist`, bestehend; Test ergänzen).
- **`/admin`:** Banner (`@kit/ui` Alert), wenn die Absenderdomain aus `EMAIL_FROM` `resend.dev` ist (oder
  `EMAIL_FROM` fehlt): „Sign-up emails only reach your own Resend address until a domain is verified.“ Kein
  API-Aufruf zur Laufzeit; nur Admins sehen es. Reine Funktion `usesResendTestSender(emailFrom)` mit Test.

## 5. DB-Rate-Limit

- **Migration** `rate_limits`: `key text`, `window_start timestamptz`, `count int`, PK `(key, window_start)`.
  RLS an, `revoke all … from anon, authenticated`, keine Policies.
- **Funktion** `public.check_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean`,
  `security definer`, `set search_path = ''`, `revoke execute … from public, anon, authenticated` (Aufruf nur
  über Admin-Client/`service_role`). Fenster = `to_timestamp(floor(epoch / window) * window)`; atomarer
  `insert … on conflict do update set count = count + 1 returning count`; `true` wenn `count <= p_max`.
  Alte Fenster (> 1 Tag) löscht die Funktion opportunistisch mit (`delete … where window_start < now() - 1 day`,
  nur bei jedem ~100. Aufruf per `random() < 0.01`), kein Extra-Job.
- **`lib/rate-limit.ts`** (`server-only`): `rateLimit(scope: string, max: number, windowSec: number): Promise<boolean>`;
  Key = `scope + ':' + sha256(ip)` mit IP aus `x-forwarded-for` (erster Eintrag) bzw. `x-real-ip`, sonst
  `'unknown'`. Speichert keine Klartext-IP. DB-Fehler → `true` (offen lassen, loggen): Warteliste soll nicht an
  einem Zähler scheitern.
- **Einbau:** `joinWaitlist` → `rateLimit('waitlist', 5, 3600)`; abgelehnt → `{ ok: false, error: 'rate-limited' }`,
  Formular zeigt Text aus next-intl. `shortcut`-Kommentar in `waitlist-actions.ts` entfernen.
- **Tests:** pgTAP (Tabelle mit RLS, Funktion für `anon`/`authenticated` nicht ausführbar, 5× true, 6. false,
  anderes Fenster/anderer Key unabhängig); Vitest für die Action (Limit erreicht → kein Upsert, Fehler
  `rate-limited`; wird rot, wenn der `rateLimit`-Aufruf fehlt) und für die Key-Bildung (kein Klartext).

## 6. Mobile-Performance

Ergebnisoffen, gemessen statt geraten:

1. Baseline: `studio:audit` gegen test-dummy (Werte aus Runde 1: LCP 2,7–4,4 s, JS 508–534 KB).
2. Bundle-Analyse (`next build` mit `@next/bundle-analyzer` nur temporär oder `.next`-Stats) für die drei Seiten;
   größte Client-Module benennen.
3. Maßnahmen nach Größe: unnötige `'use client'`-Grenzen und Provider auf Marketing-/Auth-Seiten entfernen,
   schwere Komponenten per `next/dynamic` nachladen, Fonts (`next/font`, `display: swap`, nur genutzte Schnitte),
   LCP-Element (Hero-Text) ohne Client-JS.
4. Nach jeder Maßnahme lokal `next build` + Größe prüfen; am Ende Deploy + Audit.
5. Ziel verfehlt → Rest mit Messwert und Ursache in Evaluation/Backlog für 2b (UI-Umbau) festhalten.

## Abschluss

Deploy auf test-dummy (`studio:new`-Wiederaufnahme bzw. Redeploy), `studio:audit` vorher/nachher, `studio:doctor`
gegen test-dummy, externer Review (frischer Subagent, Rollen Security + Solo-Gründer beim Setup), Fixes,
Ledger-Eintrag und Verlauf in `docs/quality-bar.md`.

## Nicht in 2a

UI-Überarbeitung, Kontaktformular (bekommt das Rate-Limit in 2b), Resend-Domain-Automatik (`studio:launch`),
Turnstile.
