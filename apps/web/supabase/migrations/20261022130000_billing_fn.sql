/*
 * -------------------------------------------------------
 * apply_billing_event
 * Called by the Stripe webhook (service_role). Marking the event as processed
 * and writing the entitlement happen in one transaction: a redelivered event
 * is a no-op, and a failed write leaves the event unprocessed so Stripe retries.
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
begin
  insert into public.processed_events (event_id)
  values (p_event_id)
  on conflict (event_id) do nothing;

  if not found then
    return false;
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

revoke execute on function public.apply_billing_event(
  text, uuid, text, public.entitlement_status, timestamptz, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.apply_billing_event(
  text, uuid, text, public.entitlement_status, timestamptz, timestamptz, text
) to service_role;
