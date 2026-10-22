/*
 * -------------------------------------------------------
 * Job queue
 * The worker (/api/jobs/worker, service_role) claims due jobs, runs them and
 * reports back. A claim hides the job for 10 minutes: if the worker dies
 * mid-job, the job becomes due again and is reclaimed. 5 attempts at most.
 * -------------------------------------------------------
 */

create or replace function public.claim_jobs(p_limit int)
  returns setof public.jobs
  language sql
  set search_path = ''
as $$
  update public.jobs
  set status = 'running',
      attempts = attempts + 1,
      run_at = now() + interval '10 minutes'
  where id in (
    select id from public.jobs
    where status in ('queued', 'running')
      and run_at <= now()
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
  update public.jobs set status = 'done' where id = p_id;
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
  where id = p_id;
$$;

create or replace function public.enqueue_daily_digests()
  returns void
  language sql
  set search_path = ''
as $$
  insert into public.jobs (type, payload)
  select 'daily-digest',
         jsonb_build_object('user_id', id, 'day', (now() at time zone 'utc')::date)
  from auth.users;
$$;

revoke execute on function
  public.claim_jobs(int),
  public.complete_job(uuid),
  public.fail_job(uuid, text, timestamptz),
  public.enqueue_daily_digests()
from public, anon, authenticated;

grant execute on function
  public.claim_jobs(int),
  public.complete_job(uuid),
  public.fail_job(uuid, text, timestamptz),
  public.enqueue_daily_digests()
to service_role;

/*
 * Account deletion cancels billing.
 * Fires on the cascade from auth.users; the job cancels the Stripe subscriptions
 * so a deleted user is not charged again.
 */
create or replace function kit.enqueue_billing_cancel()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.jobs (type, payload)
  values ('billing-cancel', jsonb_build_object('customer_id', old.customer_id));

  return old;
end;
$$;

revoke execute on function kit.enqueue_billing_cancel() from public, anon, authenticated;

create trigger enqueue_billing_cancel
  before delete on public.billing_customers
  for each row execute function kit.enqueue_billing_cancel();

/*
 * -------------------------------------------------------
 * Schedules
 * pg_cron calls the worker every minute through pg_net. URL and secret come
 * from Vault (`worker_url`, `cron_secret`); without them the call is skipped,
 * so local dev stays quiet. Vercel Cron (vercel.json) is the daily fallback.
 * -------------------------------------------------------
 */
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function kit.trigger_worker()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'worker_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'cron_secret';

  if v_url is null or v_secret is null then
    return;
  end if;

  -- pg_net is async; the timeout only bounds how long the response is awaited
  perform net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function kit.trigger_worker() from public, anon, authenticated;

-- cron.schedule with an existing job name replaces that job
select cron.schedule('studio-worker', '* * * * *', 'select kit.trigger_worker()');
select cron.schedule('studio-daily-digest', '0 6 * * *', 'select public.enqueue_daily_digests()');
