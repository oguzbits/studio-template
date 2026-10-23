begin;
create extension if not exists pgtap with schema extensions;

select plan(2);

select lives_ok(
  format('insert into public.waitlist (email) values (%L)', repeat('a', 242) || '@example.com'),
  'a 254 character email is accepted'
);

select throws_ok(
  format('insert into public.waitlist (email) values (%L)', repeat('a', 243) || '@example.com'),
  '23514',
  null,
  'an email longer than 254 characters is rejected'
);

select * from finish();
rollback;
