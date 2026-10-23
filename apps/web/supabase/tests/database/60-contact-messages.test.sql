begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

select set_config('role', 'service_role', true);
select lives_ok(
  $$ insert into public.contact_messages (email, message) values ('a@test.local', 'hello') $$,
  'service_role can insert a message'
);
select lives_ok(
  $$ insert into public.contact_messages (email, name, message) values ('a@test.local', 'A', repeat('x', 2000)) $$,
  'a message of exactly 2000 characters is accepted'
);
select throws_ok(
  $$ insert into public.contact_messages (email, message) values ('a@test.local', '') $$,
  '23514', null, 'an empty message is rejected'
);
select throws_ok(
  $$ insert into public.contact_messages (email, message) values ('a@test.local', repeat('x', 2001)) $$,
  '23514', null, 'a message of 2001 characters is rejected'
);
select throws_ok(
  $$ insert into public.contact_messages (email, message) values (repeat('x', 250) || '@a.de', 'hi') $$,
  '23514', null, 'an email longer than 254 characters is rejected'
);
select throws_ok(
  $$ insert into public.contact_messages (email, name, message) values ('a@test.local', repeat('x', 101), 'hi') $$,
  '23514', null, 'a name longer than 100 characters is rejected'
);

select set_config('role', 'authenticated', true);
select throws_ok($$ select * from public.contact_messages $$, '42501', null, 'authenticated cannot read contact_messages');
select throws_ok(
  $$ insert into public.contact_messages (email, message) values ('a@test.local', 'hi') $$,
  '42501', null, 'authenticated cannot insert contact_messages'
);

select set_config('role', 'anon', true);
select throws_ok($$ select * from public.contact_messages $$, '42501', null, 'anon cannot read contact_messages');
select throws_ok(
  $$ insert into public.contact_messages (email, message) values ('a@test.local', 'hi') $$,
  '42501', null, 'anon cannot insert contact_messages'
);

select * from finish();
rollback;
