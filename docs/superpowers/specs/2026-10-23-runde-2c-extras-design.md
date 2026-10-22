# Runde 2c (Kontaktformular, Onboarding, Admin-Nutzerliste) – Design

Stand 2026-10-23. Grundlage: [Evaluation](../../evaluation-2026-10-22.md) Punkt 6/10, [Spec 2a](2026-10-22-runde-2a-p1-design.md)
(„Kontaktformular bekommt das Rate-Limit in 2b“), [Spec 2b](2026-10-23-runde-2b-ui-design.md). Entscheidungen des
Nutzers: Nachrichten in DB **und** per Mail; Onboarding als einmalige, überspringbare Seite `/home/welcome`;
Nutzerliste nur lesend. Look: ruhiger editorialer Stil aus 2b (Serif-Überschrift, Tonflächen, keine Karten).

## Messbares Ergebnis

| # | Baustein | Ergebnis |
| --- | --- | --- |
| 1 | Kontaktformular `/contact` | Nachricht landet in `contact_messages` und als Mail beim ersten Eintrag aus `ADMIN_EMAILS`; ab der 4. Nachricht pro IP/Stunde abgelehnt |
| 2 | Admin: Nachrichten + Nutzer | `/admin` zeigt die letzten 20 Nachrichten; `/admin/users` listet Nutzer (50/Seite) mit Plan und Status |
| 3 | Onboarding | Neuer Nutzer landet auf `/home/welcome`, kann Namen setzen oder überspringen; danach nie wieder |
| 4 | Gates | `pnpm check` grün, pgTAP für die neue Tabelle, je ein E2E für Kontakt und Onboarding |

## 1. Kontaktformular

- Tabelle `contact_messages` (`id uuid pk`, `created_at`, `email text`, `name text null`, `message text`,
  `handled boolean default false`). RLS an, `revoke all … from anon, authenticated`, keine Policy: Zugriff nur über
  den Admin-Client. Check-Constraints: `char_length(message) between 1 and 2000`, `char_length(email) <= 254`.
- Seite `app/(marketing)/contact/page.tsx` (`pageMetadata`, Sitemap, Footer-Link „Contact“, Link auf der
  Fehlerseite wieder herstellen). Felder: E-Mail, Name (optional), Nachricht. Ruhiges Formular im Stil der Auth-Fläche.
- Server Action `submitContact` (`enhanceAction`, `auth: false`, Zod-Schema): zuerst `rateLimit('contact', 3, 3600)`
  (vor der Validierung, wie `joinWaitlist`), dann Insert via Admin-Client, dann `enqueueJob('contact-notification',
  { messageId })`. Rückgabe `{ ok: true } | { ok: false, error: 'rate-limited' | 'invalid' | 'failed' }`.
- Job-Handler `contact-notification`: lädt die Nachricht, sendet Mail an `ADMIN_EMAILS[0]` (Template im Stil der
  vorhandenen; Nutzereingaben nur als React-Text, nie als HTML), `replyTo` = Absender, `idempotencyKey:
  contact:<id>`. `sendEmail` bekommt dafür den optionalen Parameter `replyTo?: string`. Ohne `ADMIN_EMAILS` →
  Job endet ohne Fehler (Nachricht bleibt in `/admin` sichtbar), Warnung im Log.
- Kein Captcha, kein Honeypot (DB-Rate-Limit reicht, wie bei der Warteliste).

## 2. Admin

- `lib/admin/load-users.ts`: `loadAdminUsers(page: number)` → `{ rows: AdminUserRow[]; hasMore: boolean }`
  mit `AdminUserRow = { id; email; createdAt; emailConfirmed: boolean; plan: string | null; status: string | null }`.
  Quelle: `auth.admin.listUsers({ page, perPage: 50 })` plus `entitlements` für die Nutzer-IDs der Seite. Reine
  Funktion `mergeUsers(users, entitlements)` für den Test. Ruft vorher `requireAdmin()` wie `loadAdminMetrics`.
- Seite `app/admin/users/page.tsx` (Tabelle, „Previous / Next“ über `?page=`), Link auf `/admin`. Layout-Guard gilt.
- `/admin`: Abschnitt „Messages (last 20)“ (E-Mail, Datum, Vorschau 120 Zeichen, vollständiger Text in
  `<details>`); kein Markieren/Löschen (Backlog).
- Admin-UI bleibt schlicht (Tabellen, keine Karten); nur Tokens aus 2b.

## 3. Onboarding

- Seite `app/home/welcome/page.tsx` mit Formular „Your name“ (optional, ≤ 80 Zeichen) und zwei Aktionen
  „Continue“ und „Skip“. Server Action `completeOnboarding` (`enhanceAction`, `auth: true`, Zod): speichert den
  Namen auf demselben Weg wie `UpdateAccountDetailsForm` (dessen Server-Aktion/Aufruf wiederverwenden, nichts
  Zweites erfinden) und setzt `user_metadata.onboarded = true`; Skip setzt nur das Flag. Danach Redirect `/home`.
- `app/home/page.tsx`: ist `onboarded` nicht gesetzt → `redirect('/home/welcome')`. Nur dieser eine Einstieg, kein
  Redirect in `/home/billing` o. Ä. (Käufer, die direkt zum Portal wollen, werden nicht aufgehalten).
- `onboarded` ist ein UX-Flag in `user_metadata` (vom Nutzer selbst beschreibbar, daher **kein** Schutzmechanismus).
  Kommentar `shortcut:` im Code: produktspezifische Fragen/Schritte pro Produkt ergänzen.

## Nicht in 2c

Nachrichten markieren/löschen/beantworten im Admin, Nutzer sperren/löschen, Export, Captcha, mehrstufiges
Onboarding, Jahres-Toggle, App-Shell-Redesign (eigener Schritt nach Referenz des Nutzers).
