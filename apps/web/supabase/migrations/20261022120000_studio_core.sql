/*
 * -------------------------------------------------------
 * studio-template core tables
 * Billing (entitlements, processed_events, billing_customers), jobs, AI logging/cache,
 * waitlist, digest_sends. RLS is enabled on every table; only entitlements and
 * billing_customers are readable by their owner. Everything else is service_role only.
 * -------------------------------------------------------
 */

-- Billing ------------------------------------------------

create type public.entitlement_status as enum (
  'active',
  'trialing',
  'canceling',
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
  'canceled'
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_key text not null,
  status public.entitlement_status not null,
  current_period_end timestamptz,
  trial_end timestamptz,
  provider text not null default 'stripe',
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- also serves as the user_id index for RLS
  unique (user_id, product_key)
);

create table public.processed_events (
  event_id text primary key,
  provider text not null default 'stripe',
  processed_at timestamptz not null default now()
);

create table public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text not null unique,
  created_at timestamptz not null default now()
);

-- Jobs ---------------------------------------------------

create type public.job_status as enum ('queued', 'running', 'done', 'failed');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  run_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now()
);

create index jobs_due_idx on public.jobs (run_at)
  where status in ('queued', 'running');

-- AI -----------------------------------------------------

create table public.ai_calls (
  id bigint generated always as identity primary key,
  model text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  -- null when the model has no price in studio.config.ts
  cost_eur numeric(12, 6),
  latency_ms integer not null,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create index ai_calls_created_at_idx on public.ai_calls (created_at);

create table public.ai_cache (
  key text primary key,
  model text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- Marketing / email --------------------------------------

create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.digest_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Privileges and RLS -------------------------------------

alter table public.entitlements enable row level security;
alter table public.processed_events enable row level security;
alter table public.billing_customers enable row level security;
alter table public.jobs enable row level security;
alter table public.ai_calls enable row level security;
alter table public.ai_cache enable row level security;
alter table public.waitlist enable row level security;
alter table public.digest_sends enable row level security;

revoke all on
  public.entitlements,
  public.processed_events,
  public.billing_customers,
  public.jobs,
  public.ai_calls,
  public.ai_cache,
  public.waitlist,
  public.digest_sends
from anon, authenticated;

grant all on
  public.entitlements,
  public.processed_events,
  public.billing_customers,
  public.jobs,
  public.ai_calls,
  public.ai_cache,
  public.waitlist,
  public.digest_sends
to service_role;

grant select on public.entitlements, public.billing_customers to authenticated;

create policy entitlements_read_own on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy billing_customers_read_own on public.billing_customers
  for select to authenticated
  using ((select auth.uid()) = user_id);
