/*
 * Welcome mail and daily digest only for confirmed email addresses.
 * Email signups arrive unconfirmed and get the job on confirmation (update);
 * OAuth users are created with email_confirmed_at already set (insert).
 */
create or replace function public.enqueue_daily_digests()
  returns void
  language sql
  security definer
  set search_path = ''
as $$
  insert into public.jobs (type, payload)
  select 'daily-digest',
         jsonb_build_object('user_id', id, 'day', (now() at time zone 'utc')::date)
  from auth.users
  where email is not null
    and email_confirmed_at is not null
  on conflict ((payload->>'user_id'), (payload->>'day')) where type = 'daily-digest'
  do nothing;
$$;

revoke execute on function public.enqueue_daily_digests() from public, anon, authenticated;
grant execute on function public.enqueue_daily_digests() to service_role;

drop trigger enqueue_welcome_job on auth.users;

-- fires at most once per user: insert only if already confirmed, update only on the null -> set transition
create trigger enqueue_welcome_job
  after insert on auth.users
  for each row
  when (new.email_confirmed_at is not null)
  execute function kit.enqueue_welcome_job();

create trigger enqueue_welcome_job_on_confirm
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function kit.enqueue_welcome_job();
