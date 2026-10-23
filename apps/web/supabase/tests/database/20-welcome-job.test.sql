begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'welcome@test.local');

select is(
  (select count(*) from public.jobs
   where type = 'welcome-email'
     and payload->>'user_id' = '00000000-0000-0000-0000-0000000000a1'),
  0::bigint,
  'an unconfirmed user gets no welcome-email job'
);

update auth.users set email_confirmed_at = now()
where id = '00000000-0000-0000-0000-0000000000a1';

select is(
  (select count(*) from public.jobs
   where type = 'welcome-email'
     and payload->>'user_id' = '00000000-0000-0000-0000-0000000000a1'
     and status = 'queued'),
  1::bigint,
  'confirming the email queues exactly one welcome-email job'
);

update auth.users set email_confirmed_at = now() + interval '1 minute'
where id = '00000000-0000-0000-0000-0000000000a1';

select is(
  (select count(*) from public.jobs
   where type = 'welcome-email'
     and payload->>'user_id' = '00000000-0000-0000-0000-0000000000a1'),
  1::bigint,
  'later updates do not queue a second welcome-email job'
);

-- OAuth users are created already confirmed
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a2', 'oauth@test.local', now());

select is(
  (select count(*) from public.jobs
   where type = 'welcome-email'
     and payload->>'user_id' = '00000000-0000-0000-0000-0000000000a2'),
  1::bigint,
  'a user created already confirmed gets one welcome-email job'
);

select is(
  has_function_privilege('authenticated', 'kit.enqueue_welcome_job()', 'execute'),
  false,
  'authenticated cannot execute the trigger function'
);

select is(
  has_function_privilege('authenticated', 'public.enqueue_daily_digests()', 'execute'),
  false,
  'authenticated cannot execute enqueue_daily_digests'
);

select * from finish();
rollback;
