import type Stripe from 'stripe';

import type { Enums, Tables } from '~/lib/database.types';

export type EntitlementStatus = Enums<'entitlement_status'>;
export type Entitlement = Tables<'entitlements'>;

const ACCESS_STATUSES: EntitlementStatus[] = [
  'active',
  'trialing',
  'canceling',
];

const BILLING_STATUSES: EntitlementStatus[] = [
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
];

export function mapStripeStatus(s: {
  status: Stripe.Subscription.Status;
  cancel_at_period_end: boolean;
}): EntitlementStatus {
  switch (s.status) {
    case 'active':
      return s.cancel_at_period_end ? 'canceling' : 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'incomplete':
      return 'incomplete';
    case 'paused':
      return 'paused';
    case 'canceled':
      return 'canceled';
    case 'incomplete_expired':
      return 'canceled';
    default:
      // unknown future Stripe status: no access, but the user lands on billing
      return 'incomplete';
  }
}

export function accessDecision(
  e: Pick<Entitlement, 'status' | 'current_period_end'> | null,
  now: Date,
): 'allow' | 'billing' | 'pricing' {
  if (!e) {
    return 'pricing';
  }

  if (ACCESS_STATUSES.includes(e.status)) {
    // guards against a lost subscription.deleted webhook
    const periodOpen =
      e.current_period_end === null || new Date(e.current_period_end) > now;

    return periodOpen ? 'allow' : 'pricing';
  }

  return BILLING_STATUSES.includes(e.status) ? 'billing' : 'pricing';
}
