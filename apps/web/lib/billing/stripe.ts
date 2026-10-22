import 'server-only';

import Stripe from 'stripe';

let stripe: Stripe | undefined;

/** Created on first use so builds and pages without billing need no Stripe key. */
export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      throw new Error('Please provide the variable STRIPE_SECRET_KEY');
    }

    stripe = new Stripe(key);
  }

  return stripe;
}
