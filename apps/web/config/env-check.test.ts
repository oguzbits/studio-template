import { describe, expect, it } from 'vitest';

import { checkEnv } from './env-check';

const valid = {
  NEXT_PUBLIC_SITE_URL: 'https://acme.vercel.app',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret-value',
  CRON_SECRET: 'c'.repeat(64),
  RESEND_API_KEY: 're_secretvalue',
  EMAIL_FROM: 'Acme <onboarding@resend.dev>',
  STRIPE_SECRET_KEY: 'sk_live_secretvalue',
  STRIPE_WEBHOOK_SECRET: 'whsec_secretvalue',
  STRIPE_PRICE_PRO: 'price_123',
  ADMIN_EMAILS: 'a@b.de',
  ANTHROPIC_API_KEY: 'sk-ant-x',
  LEGAL_NAME: 'x',
  LEGAL_STREET: 'x',
  LEGAL_ZIP_CITY: 'x',
  LEGAL_EMAIL: 'x',
  LEGAL_PHONE: 'x',
  LEGAL_RESPONSIBLE: 'x',
};

const check = (overrides: Record<string, string | undefined>) =>
  checkEnv({ ...valid, ...overrides }, ['pro']);

describe('checkEnv', () => {
  it('passes a complete production env', () => {
    expect(check({})).toEqual({ errors: [], warnings: [] });
  });

  it('fails when a required value is missing', () => {
    const { errors } = check({ CRON_SECRET: undefined, EMAIL_FROM: '' });

    expect(errors).toHaveLength(2);
    expect(errors.join('\n')).toMatch(/CRON_SECRET/);
    expect(errors.join('\n')).toMatch(/EMAIL_FROM/);
  });

  it('rejects a short CRON_SECRET and a non-https site URL', () => {
    const { errors } = check({
      CRON_SECRET: 'short',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    });

    expect(errors).toHaveLength(2);
  });

  it('requires webhook secret and prices once Stripe is configured', () => {
    const { errors } = check({
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_PRICE_PRO: 'prod_wrong',
    });

    expect(errors.join('\n')).toMatch(/STRIPE_WEBHOOK_SECRET/);
    expect(errors.join('\n')).toMatch(/STRIPE_PRICE_PRO/);
  });

  it('only warns when Stripe is not configured at all', () => {
    const result = check({
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_PRICE_PRO: undefined,
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings.join('\n')).toMatch(/STRIPE_SECRET_KEY/);
  });

  it('warns that a test key takes no real payments', () => {
    const { errors, warnings } = check({ STRIPE_SECRET_KEY: 'sk_test_x' });

    expect(errors).toEqual([]);
    expect(warnings.join('\n')).toMatch(/test key/);
  });

  it('requires the analytics settings of the chosen provider', () => {
    const { errors } = check({ NEXT_PUBLIC_ANALYTICS_PROVIDER: 'plausible' });

    expect(errors.join('\n')).toMatch(/NEXT_PUBLIC_PLAUSIBLE_DOMAIN/);
  });

  it('never echoes a value', () => {
    const { errors } = check({
      RESEND_API_KEY: 'not-a-resend-key-SECRET',
      STRIPE_SECRET_KEY: 'pk_live_SECRET',
    });

    expect(errors).toHaveLength(2);
    expect(errors.join('\n')).not.toMatch(/key-SECRET|pk_live/);
  });
});
