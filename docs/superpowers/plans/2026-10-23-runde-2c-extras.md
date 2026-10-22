# Runde 2c (Kontakt, Admin-Nutzerliste, Onboarding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Öffentliches Kontaktformular mit Rate-Limit, Admin-Nutzerliste und Nachrichtenansicht, einmaliges überspringbares Onboarding.

**Architecture:** Neue Tabelle `contact_messages` nur über Admin-Client; Server Actions mit `enhanceAction`; Mail über die vorhandene Job-Queue (`enqueueJob`, Handler in `lib/jobs/registry.ts`); Onboarding-Flag in `user_metadata`.

**Tech Stack:** Next.js 16, Supabase (pgTAP), Zod, Resend/React Email, Vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-10-23-runde-2c-extras-design.md](../specs/2026-10-23-runde-2c-extras-design.md)

## Global Constraints

- Migrationen nur neu; jede neue Tabelle: `enable row level security`, `revoke all … from anon, authenticated`;
  danach `pnpm --filter web supabase:typegen` und pgTAP in `supabase/tests/database/`.
- Server-only-Module beginnen mit `import 'server-only';`; Admin-Client nur serverseitig.
- UI-Texte Englisch; Look aus Runde 2b (Serif-Überschrift, ruhige Flächen, keine Karten/Schatten/Verläufe);
  `@kit/ui`, `buttonVariants` auf `Link`; a11y 100 halten (Labels, Fokus, Kontrast).
- Jeder Test einer Schutzfunktion (Rate-Limit, RLS, Admin-Guard, Idempotenz) muss ohne den Schutz rot werden.
- Kleine Commits (Conventional Commits), Hooks nie mit `--no-verify`; vor Push `pnpm check`.
- Keine `.env*`-Dateien lesen/schreiben außer `.env.example`; neue Env-Variablen sind nicht nötig.
- Der `Button` aus `@kit/ui` (Base UI) hat `type="button"` als Default: jeder Absende-Button braucht `type="submit"` (Runde 2b: sechs Formulare schickten deshalb nie ab). E2E prüft den echten Absendeweg.
- E2E lokal direkt mit Playwright gegen den Produktions-Build laufen lassen (`build:test` + `start:test`); das `test`-Skript bricht mit `--max-failures=1` früh ab. Server Actions antworten bei Client-Redirects mit 200 + `x-action-redirect`, nicht 303.

## Review Focus

- Nachricht mit HTML/Script-Zeichen, Umlauten, 2000 Zeichen exakt und 2001 → gespeichert/abgelehnt, Mail zeigt Text
  unverändert als Text. Test: Task 2.
- `ADMIN_EMAILS` leer oder nur unbestätigte Adressen → Job endet ohne Fehler, Nachricht bleibt in `/admin`. Test: Task 2.
- Nutzer ohne Entitlement, mit mehreren Entitlements, ohne bestätigte E-Mail in der Liste. Test: Task 3.
- Admin-Seite `/admin/users` für Nicht-Admins → 404, auch wenn der Layout-Guard fehlt (Loader prüft erneut). Test: Task 3.
- Bestehender Nutzer mit `onboarded` fehlt (Altkonten) sieht Onboarding genau einmal; „Skip“ ohne Namen. Test: Task 4.

---

### Task 1: Tabelle `contact_messages`

**Files:**
- Create: `apps/web/supabase/migrations/<timestamp>_contact_messages.sql`, `apps/web/supabase/tests/database/contact-messages.test.sql`
- Modify: `apps/web/lib/database.types.ts` (Typegen), ggf. `00-rls.test.sql` nur prüfen, dass es die Tabelle automatisch abdeckt

**Interfaces:**
- Produces: Tabelle `public.contact_messages(id uuid pk default gen_random_uuid(), created_at timestamptz default now(), email text not null, name text, message text not null, handled boolean not null default false)` mit Check-Constraints aus der Spec; Typ `Tables<'contact_messages'>`.

- [ ] Step 1: pgTAP-Test schreiben: `anon` und `authenticated` können weder lesen noch einfügen (`throws_ok`/`is_empty`), Constraint lehnt leere und 2001 Zeichen lange Nachricht ab, service_role darf einfügen. Rot (Tabelle fehlt).
- [ ] Step 2: Migration nach Konvention aus Global Constraints; Typegen.
- [ ] Step 3: `pnpm test:db` grün; Schutz-Check: `revoke` in der Migration auskommentieren → Test rot, zurück.
- [ ] Step 4: Commit `feat(db): contact_messages table, RLS closed, pgTAP`.

### Task 2: Kontaktformular, Job, Mail

**Files:**
- Create: `apps/web/app/(marketing)/contact/page.tsx`, `apps/web/app/(marketing)/contact/contact-form.tsx`,
  `apps/web/app/(marketing)/contact/contact-actions.ts`, `apps/web/lib/jobs/handlers/contact-notification.ts`,
  `apps/web/lib/email/templates/contact-message.tsx`
- Modify: `apps/web/lib/email/send-email.ts` (optional `replyTo`), `apps/web/lib/jobs/registry.ts`,
  Footer (`app/(marketing)/_components/site-footer.tsx`), Sitemap-Quelle, `app/error.tsx` (Link „Contact“ zurück)
- Test: `contact-actions.test.ts`, `contact-notification.test.ts` neben dem Code

**Interfaces:**
- Consumes: `rateLimit(scope, max, windowSec): Promise<boolean>` (`~/lib/rate-limit`), `enqueueJob(type, payload, runAt?)`,
  `sendEmail({ to, subject, react, idempotencyKey, replyTo? })`, Muster `app/(marketing)/_components/waitlist-actions.ts`.
- Produces: `submitContact(formData: FormData): Promise<{ ok: true } | { ok: false; error: 'rate-limited' | 'invalid' | 'failed' }>`;
  Job-Typ `'contact-notification'` mit Payload `{ messageId: string }`.

- [ ] Step 1: Tests (Supabase-Admin-Client, `rateLimit`, `enqueueJob` gemockt wie in den Waitlist-Tests):
  `submitContact` → (a) gültig: Insert + Job enqueued, `{ok:true}`; (b) `rateLimit` false → `{ok:false,error:'rate-limited'}`, **kein** Insert; (c) leere Nachricht/ungültige E-Mail/2001 Zeichen → `'invalid'`;
  (d) `rateLimit` wird **vor** der Validierung aufgerufen. Handler: (e) sendet Mail an `ADMIN_EMAILS[0]` mit `replyTo` = Absender und `idempotencyKey: contact:<id>`; (f) `ADMIN_EMAILS` leer → kein Wurf, keine Mail; (g) Nachricht `<script>x</script>` erscheint im gerenderten Mail-Markup escaped. Rot.
- [ ] Step 2: Implementieren (Signaturen oben); Formular als Client-Komponente mit `useActionState` wie `waitlist-form.tsx`, Texte für die vier Zustände.
- [ ] Step 3: Schutz-Checks: `rateLimit`-Aufruf entfernen → (b) rot; Escaping in der Vorlage umgehen → (g) rot. Zurück.
- [ ] Step 4: Footer-/Fehlerseiten-Link, Sitemap, `pageMetadata({ path: '/contact', title: 'Contact' })`.
- [ ] Step 5: E2E `apps/e2e/tests/contact/contact.spec.ts`: Formular ausfüllen, Erfolgsmeldung sichtbar; Zeile in `contact_messages` (Admin-Client im Test, wie vorhandene E2E-Helfer).
- [ ] Step 6: Gate: typecheck, lint, format, vitest grün; Commit `feat(contact): form, rate limit, message table, admin mail job`.

### Task 3: Admin-Nutzerliste und Nachrichten

**Files:**
- Create: `apps/web/lib/admin/load-users.ts` + `load-users.test.ts`, `apps/web/app/admin/users/page.tsx`
- Modify: `apps/web/lib/admin/load-metrics.ts` (Nachrichten laden oder eigene Funktion `loadContactMessages(limit)`), `apps/web/app/admin/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()` aus `~/lib/admin/load-metrics`, `getSupabaseServerAdminClient`.
- Produces: `loadAdminUsers(page: number): Promise<{ rows: AdminUserRow[]; hasMore: boolean }>`,
  `mergeUsers(users, entitlements): AdminUserRow[]`, `loadContactMessages(limit: number): Promise<Tables<'contact_messages'>[]>`.

- [ ] Step 1: Tests: `mergeUsers` – ohne Entitlement → `plan/status null`; mehrere Entitlements → das mit Zugang (`active`/`trialing`/`canceling`) gewinnt, sonst das neueste; `emailConfirmed` aus `email_confirmed_at`. `loadAdminUsers`/`loadContactMessages` rufen `requireAdmin` zuerst (Mock wirft → Loader wirft, kein DB-Zugriff). Rot.
- [ ] Step 2: Implementieren; `page` < 1 → 1; `hasMore` = Seite voll.
- [ ] Step 3: Seiten bauen (schlichte Tabellen, Paging über `?page=`), `/admin` bekommt „Messages (last 20)“ mit `<details>` pro Nachricht.
- [ ] Step 4: Schutz-Check: `requireAdmin()` aus `loadAdminUsers` entfernen → Guard-Test rot. Zurück.
- [ ] Step 5: Gate grün; Commit `feat(admin): user list and contact messages`.

### Task 4: Onboarding

**Files:**
- Create: `apps/web/app/home/welcome/page.tsx`, `apps/web/app/home/welcome/onboarding-form.tsx`, `apps/web/app/home/welcome/onboarding-actions.ts` + Test
- Modify: `apps/web/app/home/page.tsx`

**Interfaces:**
- Produces: `completeOnboarding(formData: FormData): Promise<void>` (ruft am Ende `redirect('/home')`); reine Funktion
  `needsOnboarding(user: { user_metadata?: Record<string, unknown> }): boolean`.

- [ ] Step 1: Tests: `needsOnboarding` – Flag fehlt → true, `onboarded: true` → false; Action – mit Namen: Name gespeichert (über den vorhandenen Profil-Weg) **und** Flag gesetzt; Skip ohne Namen: nur Flag; Name > 80 Zeichen → Validierungsfehler, Flag bleibt ungesetzt; nicht angemeldet → abgewiesen (`enhanceAction auth: true`). Rot.
- [ ] Step 2: Implementieren; vor dem Schreiben den Namens-Weg der `UpdateAccountDetailsForm` im Paket `packages/features/accounts` lesen und denselben Aufruf nutzen.
- [ ] Step 3: `app/home/page.tsx`: `needsOnboarding` → `redirect('/home/welcome')`. Kommentar `shortcut:` aus der Spec.
- [ ] Step 4: Schutz-Checks: Auth-Prüfung der Action entfernen → Test rot; Flag-Setzen entfernen → Test rot.
- [ ] Step 5: E2E `apps/e2e/tests/authentication/onboarding.spec.ts`: neues Konto → landet auf `/home/welcome`, „Skip“ → `/home`, erneuter Besuch von `/home` ohne Umleitung; bestehende E2E-Helfer für Sign-up ggf. an die Umleitung anpassen (nicht die `data-test`-Attribute).
- [ ] Step 6: Gate grün; Commit `feat(onboarding): one-time welcome step`.

### Task 5: Doku und Abschluss

- [ ] Step 1: `AGENTS.md`: Architekturkarte (`contact_messages` in der Tabellenliste, Routen `/contact`, `/admin/users`, `/home/welcome`, Job `contact-notification`) und Abschnitt „Design pro Produkt“: Vorlage bleibt neutral; für ein neues Produkt den Taste-Skill (`taste-skill:design-taste-frontend`) mit dem vollen Ablauf nutzen.
- [ ] Step 2: `docs/ledger.md` (Runde 2c mit Dauer/Tokens je Task), `docs/evaluation-2026-10-22.md` (Backlog 2c abhaken).
- [ ] Step 3: `pnpm check` und `pnpm test:e2e` (Kontakt, Onboarding, Auth) grün; Commit `docs: round 2c results, agents map, ledger`.

## Ausführung

Subagent-driven, gebündelt: **A** = Task 1+2 (sonnet; öffentliche Eingabefläche → danach eigenes Review durch sonnet),
**B** = Task 3+4 (sonnet, kein Einzel-Review; Admin-Guard und Auth-Prüfung sind durch Tests mit Schutz-Check gedeckt),
Task 5 Hauptsession. Gesamt-Review des Zweigs (opus) vor dem Push.
