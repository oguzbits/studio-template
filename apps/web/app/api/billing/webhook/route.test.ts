import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stripe, rpc, logger } = vi.hoisted(() => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
  rpc: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('~/lib/billing/stripe', () => ({ getStripe: () => stripe }));
vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({ rpc }),
}));
vi.mock('@kit/shared/logger', () => ({ getLogger: async () => logger }));

const { POST } = await import('./route');

const periodEnd = 1_795_000_000;

function subscription(status: string, metadata: Record<string, string>) {
  return {
    id: 'sub_1',
    object: 'subscription',
    status,
    cancel_at_period_end: false,
    trial_end: null,
    metadata,
    items: { data: [{ current_period_end: periodEnd }] },
  };
}

const owner = {
  user_id: '00000000-0000-0000-0000-00000000000a',
  product_key: 'pro',
};

function request() {
  return new Request('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=sig' },
    body: '{}',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  rpc.mockResolvedValue({ data: true, error: null });
});

describe('POST /api/billing/webhook', () => {
  it('rejects an invalid signature with 400 and writes nothing', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    const res = await POST(request());

    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('acknowledges an event without user_id with 200, logs it and writes nothing', async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: { object: subscription('active', {}) },
    });
    stripe.subscriptions.retrieve.mockResolvedValue(subscription('active', {}));

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('acknowledges unknown events with 200 and writes nothing', async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'invoice.paid',
      data: { object: {} },
    });

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('writes the freshly retrieved subscription, not the stale event payload', async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_3',
      type: 'customer.subscription.updated',
      data: { object: subscription('incomplete', owner) },
    });
    stripe.subscriptions.retrieve.mockResolvedValue(
      subscription('active', owner),
    );

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
    expect(rpc).toHaveBeenCalledWith('apply_billing_event', {
      p_event_id: 'evt_3',
      p_user_id: owner.user_id,
      p_product_key: 'pro',
      p_status: 'active',
      p_period_end: new Date(periodEnd * 1000).toISOString(),
      p_trial_end: null,
      p_provider_ref: 'sub_1',
    });
  });

  it('grants a paid one-time purchase without period end', async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_4',
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          payment_status: 'paid',
          payment_intent: 'pi_1',
          client_reference_id: owner.user_id,
          metadata: owner,
        },
      },
    });

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      'apply_billing_event',
      expect.objectContaining({
        p_status: 'active',
        p_period_end: null,
        p_provider_ref: 'pi_1',
      }),
    );
  });

  it('returns 500 when the database write fails so Stripe retries', async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      id: 'evt_5',
      type: 'customer.subscription.created',
      data: { object: subscription('active', owner) },
    });
    stripe.subscriptions.retrieve.mockResolvedValue(
      subscription('active', owner),
    );
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const res = await POST(request());

    expect(res.status).toBe(500);
  });
});
