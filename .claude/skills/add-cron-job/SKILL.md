---
name: add-cron-job
description: Use when adding background work, a scheduled/recurring task, a retryable side effect or a new job type to the studio-template job queue.
---

# Job / Cron-Job hinzufügen

Queue: Tabelle `jobs`, Worker `app/api/jobs/worker/route.ts` (pg_cron jede Minute), Claim mit
`FOR UPDATE SKIP LOCKED`, Backoff exponentiell, max. 5 Versuche (danach `failed`, sichtbar auf `/admin`).
Pfade relativ zu `apps/web`.

1. **Handler** `lib/jobs/handlers/<name>.ts`:
   ```ts
   import 'server-only';
   import { z } from 'zod';
   import type { JobHandler } from '../registry';

   const PayloadSchema = z.object({ user_id: z.guid() });

   export const myJob: JobHandler = async (payload, { now }) => {
     const { user_id } = PayloadSchema.parse(payload);
     // ... Wurf (throw) = Retry mit Backoff
   };
   ```
   **Idempotent bauen**: Ein Job kann doppelt laufen (Retry nach Timeout, doppelter Cron). Externe Aufrufe mit
   Idempotency-Key (`sendEmail({ idempotencyKey })`, Stripe `idempotencyKey`), DB-Schreibvorgänge mit
   `on conflict do nothing`. Vorbild: `handlers/daily-digest.ts` (prüft Marker, sendet, schreibt Marker).
2. **Registrieren** in `lib/jobs/registry.ts` (`handlers`-Map, Key = Job-Typ, kebab-case).
3. **Einreihen**
   - aus App-Code: `await enqueueJob('<typ>', payload, runAt?)` (`lib/jobs/enqueue.ts`, Admin-Client).
   - aus der DB (Trigger): `insert into public.jobs (type, payload) …` in einer security-definer-Funktion,
     Vorbild `supabase/migrations/20261022140000_welcome_job.sql`.
   - **wiederkehrend**: neue Migration mit einer `public.enqueue_<name>()`-Funktion (security definer,
     `set search_path = ''`, `revoke execute … from public, anon, authenticated`) und
     `select cron.schedule('studio-<name>', '<cron>', 'select public.enqueue_<name>()');`
     Gegen Doppel-Einreihung einen Unique-Partial-Index + `on conflict do nothing` (Vorbild
     `jobs_daily_digest_once_idx` in `20261022151000_jobs_fn_fixes.sql`).
4. **Vercel-Fallback** (nur falls pg_cron nicht verfügbar): `vercel.json` → `crons`; Hobby erlaubt nur 1×/Tag.
   Der Worker nimmt GET mit `Authorization: Bearer $CRON_SECRET` an.
5. **Tests**
   - Vitest neben dem Handler (Vorbild `handlers/billing-cancel.test.ts`, externe Dienste mit `vi.mock`):
     Erfolg, ungültiger Payload wirft, zweiter Lauf hat keinen doppelten Effekt.
   - pgTAP in `supabase/tests/database/30-jobs.test.sql` für Trigger/Enqueue-Funktionen (zweimal aufrufen →
     ein Job).
6. `pnpm check` → Commit `feat(jobs): …`.
