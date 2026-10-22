/*
 * -------------------------------------------------------
 * Job queue review fixes
 * - A job whose worker crashed on the 5th attempt is failed instead of reclaimed forever.
 * - complete_job/fail_job only touch running jobs, so a stale worker cannot
 *   overwrite a job that was reclaimed after its visibility timeout.
 * - The daily digest is enqueued at most once per user and day.
 * - Only Stripe customers get a Stripe cancel job.
 * -------------------------------------------------------
 */

create or replace function public.claim_jobs(p_limit int)
  returns setof public.jobs
  language sql
  set search_path = ''
as $$
  update public.jobs
  set status = 'failed',
      last_error = 'abandoned after 5 attempts (worker crashed or timed out)'
  where id in (
    select id from public.jobs
    where status = 'running'
      and run_at <= now()
      and attempts >= 5
    for update skip locked
  );

  update public.jobs
  set status = 'running',
      attempts = attempts + 1,
      run_at = now() + interval '10 minutes'
  where id in (
    select id from public.jobs
    where status in ('queued', 'running')
      and run_at <= now()
      and attempts < 5
    order by run_at
    limit p_limit
    for update skip locked
  )
  returning *;
$$;

create or replace function public.complete_job(p_id uuid)
  returns void
  language sql
  set search_path = ''
as $$
  update public.jobs set status = 'done' where id = p_id and status = 'running';
$$;

-- attempts was already incremented by the claim
create or replace function public.fail_job(
  p_id uuid,
  p_error text,
  p_retry_at timestamptz
) returns void
  language sql
  set search_path = ''
as $$
  update public.jobs
  set status = case when attempts >= 5 then 'failed' else 'queued' end::public.job_status,
      run_at = case when attempts >= 5 then run_at else p_retry_at end,
      last_error = p_error
  where id = p_id and status = 'running';
$$;

-- pg_cron and the Vercel fallback both enqueue; the index keeps one job per user and day
create unique index jobs_daily_digest_once_idx
  on public.jobs ((payload->>'user_id'), (payload->>'day'))
  where type = 'daily-digest';

create or replace function public.enqueue_daily_digests()
  returns void
  language sql
  set search_path = ''
as $$
  insert into public.jobs (type, payload)
  select 'daily-digest',
         jsonb_build_object('user_id', id, 'day', (now() at time zone 'utc')::date)
  from auth.users
  where email is not null
  on conflict ((payload->>'user_id'), (payload->>'day')) where type = 'daily-digest'
  do nothing;
$$;

/*
 * Any deletion of a Stripe billing_customers row cancels that customer's Stripe
 * subscriptions. Intended trigger: account deletion (cascade from auth.users).
 */
drop trigger enqueue_billing_cancel on public.billing_customers;

create trigger enqueue_billing_cancel
  before delete on public.billing_customers
  for each row
  when (old.provider = 'stripe')
  execute function kit.enqueue_billing_cancel();
