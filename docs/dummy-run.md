# Probelauf `pnpm studio:new test-dummy` (2026-10-22)

Status: **live** – https://test-dummy-beta.vercel.app (19:38:03 MESZ).

## Zeit bis „live“

| Schritt | Dauer |
| --- | --- |
| Template kopieren, `pnpm install`, Git-Init | ~10 s |
| Supabase-Projekt anlegen bis `ACTIVE_HEALTHY` | ~5 min |
| Migrationen (10 Dateien) | <1 min |
| Vercel-Projekt, Env, `.env.local`, Produktions-Deploy | ~2,5 min (Build 2 min 22 s) |
| URL-Prüfung, Supabase Auth/SMTP/Vault, Health-Check | 10 s |
| **Netto-Laufzeit des Skripts** | **~9 min** |
| Wanduhr inkl. Skript-Fixes und Supabase-Störung (18:53:55–19:38:03) | 44 min |

Ohne Störung und mit den Fixes unten liegt ein Lauf bei ~10 min; dazu kommen die manuellen Schritte der
Checkliste (Stripe-Konto, Produkt, Webhook, Kundenportal: geschätzt 10–15 min).

## Geprüft nach dem Lauf

- `/api/health` → `{"ok":true,"db":"ok"}`; `/`, `/pricing`, `/auth/sign-in`, `/auth/sign-up`, `/impressum`, `/datenschutz` → 200.
- `/home` ohne Login → 307 auf `/auth/sign-in?next=/home`; `/admin` ohne Login → Sign-in (Redirect im Stream,
  HTTP 200 ohne Metriken im HTML); `/api/jobs/worker` ohne Token → 401.
- pg_cron: `studio-worker` jede Minute, Läufe `succeeded`, Worker antwortet 200; `studio-daily-digest` 06:00 UTC.
  Vault: `worker_url`, `cron_secret`.
- Impressum zeigt die Platzhalter (`LEGAL_*` nicht in `.env.shared` gesetzt) – gewolltes Verhalten.
- Noch offen: Registrierung mit Bestätigungsmail (Resend-SMTP), Stripe-Testzahlung (Stripe-Konto fehlt).

## Verlauf

| Versuch | Start (MESZ) | Ergebnis | Ursache | Fix |
| --- | --- | --- | --- | --- |
| 1 | – | ✗ Supabase-Projekt anlegen | `supabase projects create` scheitert mit Org-scoped Token („Failed to retrieve organization“); Fehlertext enthielt das DB-Passwort | Projekt per Management API anlegen; `run()` gibt keine Argumente mehr aus (`dc6cd2f`) |
| 2 | 18:56 | ✗ `POST /v1/projects` → 500 „Failed to check user auth status“ | veraltete Felder `organization_id`/`region` | `organization_slug` + `region_selection` (`ee98b46`) |
| 3 | 19:00 | ✗ `POST /v1/projects` → 500 „createInitialAPIKeys failed“ | Supabase-seitig (Störungsbeginn 19:01:52) | keiner nötig, Wiederholung |
| 4 | 19:02 | ✓ Projekt angelegt (19:02:45), `ACTIVE_HEALTHY` nach ~5 min; ✗ Migrationen | `relation "storage.buckets" does not exist`: Storage-Tenant nie angelegt (`TenantNotFound`, Mgmt-API `GET /tenants/<ref>` → 404) | Skript wartet vor den Migrationen bis zu 15 min auf `storage.buckets`, CLI-Fehler sichtbar (`b2e2555`) |
| 5 | 19:34 | ✓ Migrationen, Vercel, Deploy; ✗ URL-Prüfung `fetch failed` | Netzwerkfehler (npm-Registry zeitgleich sehr langsam) | keiner nötig, Wiederholung |
| 6 | 19:37 | ✓ live nach 10 s | – | – |

Storage kam um 19:34 (32 min nach dem Anlegen), während die Störung noch lief.
Beim Deploy fiel auf: Turborepo filtert im Vercel-Build nicht deklarierte Env-Variablen. `LEGAL_*` wird beim
statischen Build der Rechtsseiten gelesen → in `turbo.json` als `env` des Build-Tasks eingetragen. Die übrigen
gewarnten Variablen (Service-Role-Key, `CRON_SECRET`, Resend, `ADMIN_EMAILS`) braucht nur die Laufzeit, dort
setzt Vercel sie unabhängig von Turborepo.

Nebenbei gefunden: `next build` bricht mit `SecurityFatalError` ab (Next 16.4.0, GHSA-2464-fhr4-w9xw RCE,
GHSA-p3m5-59mp-jv5r DoS) → Next 16.4.2, `fast-uri` 3.1.9 per Override (`7d3dd33`).

## Erkenntnisse für das Skript

- Die Supabase-CLI ist mit Org-scoped Tokens für Org-Aktionen unbrauchbar; Management API nutzen.
- `ACTIVE_HEALTHY` heißt nicht, dass alle Dienste bereit sind: Storage separat prüfen.
- Fehlermeldungen der Supabase-CLI stehen auf stdout; nie abfangen, sonst ist der Fehler unsichtbar.
- Schritte sind über `.studio/state.json` fortsetzbar; ein Abbruch mitten im Lauf kostet nur den fehlgeschlagenen Schritt.

## Minimale Rechte für den Supabase-Token

Das Skript ruft nur diese Endpunkte auf (plus `supabase link`/`db push` mit DB-Passwort):

| Endpunkt | Zweck | Recht |
| --- | --- | --- |
| `GET /v1/organizations`, `GET /v1/organizations/{slug}` | Preflight | Organization: read |
| `GET /v1/projects`, `POST /v1/projects` | Projekt finden/anlegen | Organization Projects: read-write |
| `GET /v1/projects/{ref}`, `GET …/api-keys` | Status, Keys | Project: read, API keys: read |
| `POST …/database/query` | Storage-Check, Vault-Secrets, Cron-URL | Database: read-write |
| `PATCH …/config/auth` | Site-URL, Redirects, SMTP, Google | Auth config: read-write |

Ablaufdatum setzen (z. B. 90 Tage) und den Token nach dem Bootstrap neuer Projekte rotieren.
Die genaue Benennung der Rechte im Dashboard beim Anlegen abgleichen; `supabase link` braucht
zusätzlich Lesezugriff auf die Pooler-/Datenbank-Konfiguration des Projekts.
