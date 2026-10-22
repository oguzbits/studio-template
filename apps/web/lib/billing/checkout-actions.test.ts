import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stripe, tables, user } = vi.hoisted(() => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
  },
  tables: {} as Record<string, unknown>,
  user: { id: '00000000-0000-0000-0000-00000000000a', email: 'a@test.local' },
}));

function table(data: unknown) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data, error: null }),
    upsert: async () => ({ error: null }),
  };

  return query;
}

vi.mock('~/lib/billing/stripe', () => ({ getStripe: () => stripe }));
vi.mock('~/lib/billing/require-entitlement', () => ({
  PRICING_PATH: '/pricing',
}));
vi.mock('~/config/app.config', () => ({
  default: { url: 'http://localhost:3000' },
}));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: (name: string) => tables[name],
  }),
}));
vi.mock('@kit/next/actions', () => ({
  enhanceAction:
    (fn: (params: unknown, u: typeof user) => unknown) => (params: unknown) =>
      fn(params, user),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

process.env.STRIPE_PRICE_PRO = 'price_pro';

const { createCheckout } = await import('./checkout-actions');

beforeEach(() => {
  vi.clearAllMocks();
  tables.billing_customers = table({ customer_id: 'cus_a' });
  stripe.checkout.sessions.create.mockResolvedValue({
    url: 'https://checkout.stripe.test/s',
  });
  stripe.billingPortal.sessions.create.mockResolvedValue({
    url: 'https://billing.stripe.test/p',
  });
});

describe('createCheckout', () => {
  it('sends a user with a billing problem to the portal instead of a second subscription', async () => {
    tables.entitlements = table({
      status: 'past_due',
      current_period_end: null,
    });

    await expect(createCheckout('pro')).rejects.toThrow(
      'REDIRECT https://billing.stripe.test/p',
    );
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('starts a new checkout after the previous subscription was canceled', async () => {
    tables.entitlements = table({
      status: 'canceled',
      current_period_end: null,
    });

    await expect(createCheckout('pro')).rejects.toThrow(
      'REDIRECT https://checkout.stripe.test/s',
    );
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_a',
        client_reference_id: user.id,
        metadata: { user_id: user.id, product_key: 'pro' },
        subscription_data: {
          metadata: { user_id: user.id, product_key: 'pro' },
        },
      }),
    );
  });
});
