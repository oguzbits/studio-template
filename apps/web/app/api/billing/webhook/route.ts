import type Stripe from 'stripe';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import studioConfig from '~/config/studio.config';
import { type EntitlementStatus, mapStripeStatus } from '~/lib/billing/status';
import { getStripe } from '~/lib/billing/stripe';

type EntitlementUpdate = {
  userId: string | null | undefined;
  productKey: string | undefined;
  status: EntitlementStatus;
  periodEnd: string | null;
  trialEnd: string | null;
  providerRef: string | null;
};

const ctx = { name: 'billing.webhook' };

// 23503: user deleted (FK), 22P02: user_id is not a uuid. Retrying cannot fix these.
const PERMANENT_DB_ERRORS = new Set(['23503', '22P02']);

// shortcut: concurrent deliveries for the same subscription can write an older re-fetched state until the next event, upgrade by ordering on event.created when that window matters
// shortcut: refunds/chargebacks (charge.refunded, charge.dispute.created) do not revoke one-time entitlements (revoke manually in the DB), upgrade when one-time products matter

export async function POST(request: Request) {
  const logger = await getLogger();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    logger.error(ctx, 'STRIPE_WEBHOOK_SECRET is not set');

    return new Response('Webhook not configured', { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get('stripe-signature') ?? '',
      secret,
    );
  } catch (error) {
    logger.warn({ ...ctx, error }, 'Invalid Stripe webhook signature');

    return new Response('Invalid signature', { status: 400 });
  }

  const update = await toEntitlementUpdate(stripe, event);

  if (!update) {
    return new Response(null, { status: 200 });
  }

  if (!update.userId || !update.productKey) {
    logger.warn(
      { ...ctx, eventId: event.id, type: event.type },
      'Stripe event without user_id/product_key metadata, ignored',
    );

    return new Response(null, { status: 200 });
  }

  if (!Object.hasOwn(studioConfig.products, update.productKey)) {
    logger.warn(
      { ...ctx, eventId: event.id, productKey: update.productKey },
      'Stripe event for a product not in studio.config, ignored',
    );

    return new Response(null, { status: 200 });
  }

  const { error } = await getSupabaseServerAdminClient().rpc(
    'apply_billing_event',
    {
      p_event_id: event.id,
      p_user_id: update.userId,
      p_product_key: update.productKey,
      p_status: update.status,
      // typegen marks every rpc arg non-null; the SQL function accepts null
      p_period_end: update.periodEnd as string,
      p_trial_end: update.trialEnd as string,
      p_provider_ref: update.providerRef as string,
    },
  );

  if (error && PERMANENT_DB_ERRORS.has(error.code)) {
    logger.warn(
      { ...ctx, eventId: event.id, error },
      'apply_billing_event rejected the event permanently, acknowledged',
    );

    return new Response(null, { status: 200 });
  }

  if (error) {
    logger.error(
      { ...ctx, eventId: event.id, error },
      'apply_billing_event failed',
    );

    // not marked as processed (same transaction), so Stripe's retry re-applies it
    return new Response('Database error', { status: 500 });
  }

  return new Response(null, { status: 200 });
}

async function toEntitlementUpdate(
  stripe: Stripe,
  event: Stripe.Event,
): Promise<EntitlementUpdate | null> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;

      if (session.mode === 'subscription' && session.subscription) {
        const id =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

        return fromSubscription(await stripe.subscriptions.retrieve(id));
      }

      // async payment methods (e.g. SEPA) complete unpaid; async_payment_succeeded follows
      if (session.mode === 'payment' && session.payment_status === 'paid') {
        return {
          userId: session.metadata?.user_id ?? session.client_reference_id,
          productKey: session.metadata?.product_key,
          status: 'active',
          periodEnd: null,
          trialEnd: null,
          providerRef:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        };
      }

      return null;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // events can arrive out of order: always write Stripe's current state
      return fromSubscription(
        await stripe.subscriptions.retrieve(event.data.object.id),
      );

    default:
      return null;
  }
}

function fromSubscription(sub: Stripe.Subscription): EntitlementUpdate {
  const periodEnd = sub.items.data[0]?.current_period_end;

  return {
    userId: sub.metadata.user_id,
    productKey: sub.metadata.product_key,
    status: mapStripeStatus(sub),
    periodEnd: periodEnd ? toIso(periodEnd) : null,
    trialEnd: sub.trial_end ? toIso(sub.trial_end) : null,
    providerRef: sub.id,
  };
}

function toIso(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString();
}
