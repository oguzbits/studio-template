import { describe, expect, it } from 'vitest';

import {
  type EntitlementStatus,
  accessDecision,
  mapStripeStatus,
} from './status';

describe('mapStripeStatus', () => {
  const cases: [string, boolean, EntitlementStatus][] = [
    ['active', false, 'active'],
    ['active', true, 'canceling'],
    ['trialing', false, 'trialing'],
    ['trialing', true, 'trialing'],
    ['past_due', false, 'past_due'],
    ['past_due', true, 'past_due'],
    ['unpaid', false, 'unpaid'],
    ['unpaid', true, 'unpaid'],
    ['incomplete', false, 'incomplete'],
    ['incomplete', true, 'incomplete'],
    ['paused', false, 'paused'],
    ['paused', true, 'paused'],
    ['incomplete_expired', false, 'canceled'],
    ['incomplete_expired', true, 'canceled'],
    ['canceled', false, 'canceled'],
    ['canceled', true, 'canceled'],
  ];

  it.each(cases)(
    '%s (cancel_at_period_end=%s) -> %s',
    (status, cancel, expected) => {
      expect(mapStripeStatus({ status, cancel_at_period_end: cancel })).toBe(
        expected,
      );
    },
  );

  it('denies access for statuses Stripe adds later', () => {
    expect(
      mapStripeStatus({ status: 'something_new', cancel_at_period_end: false }),
    ).toBe('incomplete');
  });
});

describe('accessDecision', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const future = '2026-11-22T12:00:00Z';
  const past = '2026-10-21T12:00:00Z';

  const cases: [EntitlementStatus, 'allow' | 'billing' | 'pricing'][] = [
    ['active', 'allow'],
    ['trialing', 'allow'],
    ['canceling', 'allow'],
    ['past_due', 'billing'],
    ['unpaid', 'billing'],
    ['incomplete', 'billing'],
    ['paused', 'billing'],
    ['canceled', 'pricing'],
  ];

  it.each(cases)('%s -> %s', (status, expected) => {
    expect(accessDecision({ status, current_period_end: future }, now)).toBe(
      expected,
    );
  });

  it('no entitlement -> pricing', () => {
    expect(accessDecision(null, now)).toBe('pricing');
  });

  it('canceling after the period ended -> pricing (lost subscription.deleted)', () => {
    expect(
      accessDecision({ status: 'canceling', current_period_end: past }, now),
    ).toBe('pricing');
  });

  it.each(['active', 'trialing'] as const)(
    '%s after the period ended -> allow (renewal webhook may lag)',
    (status) => {
      expect(accessDecision({ status, current_period_end: past }, now)).toBe(
        'allow',
      );
    },
  );

  it('active one-time purchase without period end -> allow', () => {
    expect(
      accessDecision({ status: 'active', current_period_end: null }, now),
    ).toBe('allow');
  });
});
