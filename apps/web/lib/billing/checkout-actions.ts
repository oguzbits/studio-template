'use server';

import { redirect } from 'next/navigation';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';
import studioConfig, { type ProductKey } from '~/config/studio.config';

import { PRICING_PATH } from './require-entitlement';
import { getStripe } from './stripe';

export const createCheckout = enhanceAction(
  async (productKey: ProductKey, user) => {
    // bound action args arrive from the client: never trust the key
    const product = Object.hasOwn(studioConfig.products, productKey)
      ? studioConfig.products[productKey]
      : undefined;

    if (!product) {
      throw new Error(`Unknown product "${String(productKey)}"`);
    }

    if (!product.priceId) {
      throw new Error(
        `No Stripe price for product "${productKey}". Please provide the variable STRIPE_PRICE_${productKey.toUpperCase()}`,
      );
    }

    const metadata = { user_id: user.id, product_key: productKey };

    const session = await getStripe().checkout.sessions.create({
      mode: product.mode,
      customer: await getOrCreateCustomerId(user.id, user.email),
      client_reference_id: user.id,
      line_items: [{ price: product.priceId, quantity: 1 }],
      metadata,
      ...(product.mode === 'subscription'
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
      success_url: new URL(
        `${pathsConfig.app.billing}?checkout=success`,
        appConfig.url,
      ).href,
      cancel_url: new URL(PRICING_PATH, appConfig.url).href,
    });

    if (!session.url) {
      throw new Error('Stripe returned no checkout URL');
    }

    redirect(session.url);
  },
  {},
);

export const openPortal = enhanceAction(async (_formData: FormData, user) => {
  const customerId = await findCustomerId(user.id);

  if (!customerId) {
    redirect(PRICING_PATH);
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: new URL(pathsConfig.app.billing, appConfig.url).href,
  });

  redirect(session.url);
}, {});

async function findCustomerId(userId: string) {
  const { data, error } = await getSupabaseServerAdminClient()
    .from('billing_customers')
    .select('customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.customer_id ?? null;
}

async function getOrCreateCustomerId(userId: string, email?: string) {
  const existing = await findCustomerId(userId);

  if (existing) {
    return existing;
  }

  const customer = await getStripe().customers.create(
    { email, metadata: { user_id: userId } },
    // a double click within 24h returns the same customer instead of a duplicate
    { idempotencyKey: `customer:${userId}` },
  );

  const { error } = await getSupabaseServerAdminClient()
    .from('billing_customers')
    .upsert(
      { user_id: userId, customer_id: customer.id },
      { onConflict: 'user_id', ignoreDuplicates: true },
    );

  if (error) {
    throw error;
  }

  return customer.id;
}
