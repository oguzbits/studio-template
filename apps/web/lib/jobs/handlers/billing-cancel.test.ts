import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stripe } = vi.hoisted(() => ({
  stripe: { subscriptions: { list: vi.fn(), cancel: vi.fn() } },
}));

vi.mock('~/lib/billing/stripe', () => ({ getStripe: () => stripe }));

const { billingCancel } = await import('./billing-cancel');

const ctx = { now: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('billing-cancel', () => {
  it('cancels every subscription of the customer that is still running', async () => {
    // the SDK list result is async iterable (auto-pagination); an array iterates the same way
    stripe.subscriptions.list.mockReturnValue([
      { id: 'sub_active', status: 'active' },
      { id: 'sub_canceled', status: 'canceled' },
      { id: 'sub_expired', status: 'incomplete_expired' },
      { id: 'sub_trial', status: 'trialing' },
    ]);

    await billingCancel({ customer_id: 'cus_1' }, ctx);

    expect(stripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_1',
      status: 'all',
    });
    expect(stripe.subscriptions.cancel.mock.calls).toEqual([
      ['sub_active'],
      ['sub_trial'],
    ]);
  });

  it('rejects an invalid payload', async () => {
    await expect(billingCancel({}, ctx)).rejects.toThrow();
    expect(stripe.subscriptions.list).not.toHaveBeenCalled();
  });
});
