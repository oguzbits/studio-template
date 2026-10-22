import 'server-only';

import { z } from 'zod';

import { getStripe } from '~/lib/billing/stripe';

import type { JobHandler } from '../registry';

const PayloadSchema = z.object({ customer_id: z.string().min(1) });

// terminal states; Stripe rejects cancel for both
const ENDED = new Set(['canceled', 'incomplete_expired']);

export const billingCancel: JobHandler = async (payload) => {
  const { customer_id: customer } = PayloadSchema.parse(payload);
  // throws without STRIPE_SECRET_KEY, so the job retries and ends up failed visibly
  const stripe = getStripe();

  for await (const subscription of stripe.subscriptions.list({
    customer,
    status: 'all',
  })) {
    if (!ENDED.has(subscription.status)) {
      await stripe.subscriptions.cancel(subscription.id);
    }
  }
};
