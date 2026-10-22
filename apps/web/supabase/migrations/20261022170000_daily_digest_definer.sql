-- The Vercel fallback calls enqueue_daily_digests as service_role, which cannot read auth.users:
-- run as owner, callable only by service_role (pg_cron runs as postgres).
alter function public.enqueue_daily_digests() security definer;

revoke execute on function public.enqueue_daily_digests() from public, anon, authenticated;
grant execute on function public.enqueue_daily_digests() to service_role;
