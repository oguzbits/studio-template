/*
 * Queue a welcome email job for every new auth user.
 * The function lives in the non-exposed schema `kit` and is only run by the trigger.
 */
create or replace function kit.enqueue_welcome_job()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.jobs (type, payload)
  values ('welcome-email', jsonb_build_object('user_id', new.id));

  return new;
end;
$$;

revoke execute on function kit.enqueue_welcome_job() from public, anon, authenticated;

create trigger enqueue_welcome_job
  after insert on auth.users
  for each row execute function kit.enqueue_welcome_job();
