begin;
create extension if not exists pgtap with schema extensions;

select plan(2);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'welcome@test.local');

select is(
  (select count(*) from public.jobs
   where type = 'welcome-email'
     and payload->>'user_id' = '00000000-0000-0000-0000-0000000000a1'
     and status = 'queued'),
  1::bigint,
  'a new user gets exactly one queued welcome-email job'
);

select is(
  has_function_privilege('authenticated', 'kit.enqueue_welcome_job()', 'execute'),
  false,
  'authenticated cannot execute the trigger function'
);

select * from finish();
rollback;
