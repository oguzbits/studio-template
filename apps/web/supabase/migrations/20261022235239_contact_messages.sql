-- Public contact form messages (service_role only, written by the server action, read in /admin)
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) <= 254),
  name text check (char_length(name) <= 100),
  message text not null check (char_length(message) between 1 and 2000),
  handled boolean not null default false
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
