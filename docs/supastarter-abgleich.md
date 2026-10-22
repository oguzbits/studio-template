# Abgleich mit der supastarter-Changelog (2026-10-22)

Quelle: https://supastarter.dev/changelog, Seiten 1–5 (Dez. 2024 bis Okt. 2026; Lücke Ende Aug. bis Anfang Dez. 2025).
supastarter nutzt Better Auth/Prisma statt Supabase Auth, daher nur Konzepte übertragen. Jeder Punkt wurde gegen unseren Code geprüft.

| Thema (supastarter) | Unser Stand | Aktion |
| --- | --- | --- |
| Sichere Redirects, nur interne Pfade (Juni/Juli 2026) | **Lücke im Kit:** `/auth/callback?next=https://…` und `next` nach Passwort-Login leiteten auf fremde Seiten weiter | behoben: `isInternalPath` in `@kit/shared/utils`, genutzt in `auth-callback.service.ts` und `sign-in-methods-container.tsx`; Test `apps/web/app/auth/callback/route.test.ts` |
| Checkout ohne widersprüchliche Customer-Parameter (Mai 2026) | Checkout setzt nur `customer` (vorher angelegt), nie `customer_email` | keine |
| Preis serverseitig auflösen (März 2026) | Client schickt nur `productKey`, Preis-ID aus `studio.config.ts`, Key validiert | keine |
| Portal nur für den Besitzer (Mai 2026) | Portal mit `billing_customers` des eingeloggten Users | keine |
| Abos bei Account-Löschung kündigen (Juni 2025) | Trigger auf `billing_customers` → Job `billing-cancel` | keine |
| Kein In-Memory-Rate-Limit auf Serverless (Juli 2026) | keins vorhanden | keine |
| Account-Enumeration (Juni 2026) | Supabase-Defaults (generische Login-Fehler, verschleierte Sign-up-Antwort bei aktiver Bestätigung) | keine; E-Mail-Bestätigung muss an bleiben (AGENTS.md) |
| Dependency-Cooldown 1 Tag (Mai 2026) | pnpm 11 Default `minimumReleaseAge` = 1440 min | keine |
| Zugriff nur active/trialing/canceling, Trial-Ende speichern (Okt. 2026) | identisch, `entitlements.trial_end` vorhanden | keine |
| KI-Aufrufe autorisieren (Juli 2026) | `generateStructured` ist server-only; Skill `add-ai-task` verlangt `requireEntitlement` vor Nutzeraufrufen | keine |
| Setup-Skripte brechen unbemerkt (Sept. 2026) | `studio:new --dry-run` + Lib-Tests; echter Lauf in M9 | Probelauf dokumentieren |

Außerhalb des Scopes: weitere Zahlungsanbieter, Organisationen/Rollen/Seats, i18n, Passkeys/2FA, Uploads, Blog/CMS, Design.
