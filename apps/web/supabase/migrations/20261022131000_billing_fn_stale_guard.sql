/*
 * -------------------------------------------------------
 * apply_billing_event: ignore stale events from replaced subscriptions
 * After a user resubscribes, a late event of the old subscription (e.g. its
 * cancellation) must not revoke access granted by the new one. Such an event is
 * recorded as processed but leaves the entitlement unchanged.
 * -------------------------------------------------------
 */

create or replace function public.apply_billing_event(
  p_event_id text,
  p_user_id uuid,
  p_product_key text,
  p_status public.entitlement_status,
  p_period_end timestamptz,
  p_trial_end timestamptz,
  p_provider_ref text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.entitlement_status;
  v_provider_ref text;
begin
  insert into public.processed_events (event_id)
  values (p_event_id)
  on conflict (event_id) do nothing;

  if not found then
    return false;
  end if;

  -- row lock serializes concurrent events for the same entitlement
  select e.status, e.provider_ref
  into v_status, v_provider_ref
  from public.entitlements e
  where e.user_id = p_user_id and e.product_key = p_product_key
  for update;

  if v_provider_ref is not null
    and v_provider_ref is distinct from p_provider_ref
    and v_status in ('active', 'trialing', 'canceling')
    and p_status not in ('active', 'trialing', 'canceling') then
    return true;
  end if;

  insert into public.entitlements (
    user_id,
    product_key,
    status,
    current_period_end,
    trial_end,
    provider_ref
  )
  values (
    p_user_id,
    p_product_key,
    p_status,
    p_period_end,
    p_trial_end,
    p_provider_ref
  )
  on conflict (user_id, product_key) do update set
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    trial_end = excluded.trial_end,
    provider_ref = excluded.provider_ref,
    updated_at = now();

  return true;
end;
$$;

-- create or replace keeps the existing grants; restated so this file stands alone
revoke execute on function public.apply_billing_event(
  text, uuid, text, public.entitlement_status, timestamptz, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.apply_billing_event(
  text, uuid, text, public.entitlement_status, timestamptz, timestamptz, text
) to service_role;
