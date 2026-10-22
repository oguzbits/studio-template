-- Operator dashboard numbers in one call (service_role only, used by /admin)
create function public.admin_metrics()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'signups_total', (select count(*) from auth.users),
    'signups_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_by_product', coalesce((
      select json_object_agg(product_key, n)
      from (
        select product_key, count(distinct user_id) as n
        from public.entitlements
        where status in ('active', 'trialing', 'canceling')
        group by product_key
      ) s
    ), '{}'::json),
    'ai_cost_eur_30d', (
      select coalesce(sum(cost_eur), 0) from public.ai_calls
      where created_at > now() - interval '30 days'
    ),
    'ai_unpriced_30d', (
      select count(*) from public.ai_calls
      where cost_eur is null and created_at > now() - interval '30 days'
    ),
    'failed_jobs', coalesce((
      select json_agg(j) from (
        select id, type, attempts, last_error, run_at, created_at
        from public.jobs where status = 'failed'
        order by created_at desc limit 20
      ) j
    ), '[]'::json)
  );
$$;

revoke execute on function public.admin_metrics() from public, anon, authenticated;
grant execute on function public.admin_metrics() to service_role;
