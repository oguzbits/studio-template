import { describe, expect, it } from 'vitest';

import {
  buildChecklist,
  formEncode,
  priceBody,
  stripeKeyError,
  portBase,
  rewritePorts,
  sqlLiteral,
  validateName,
} from './studio-new-lib.mjs';

describe('validateName', () => {
  it('akzeptiert kurze kebab-case Namen', () => {
    for (const n of ['abc', 'vergabe-radar', 'test-dummy', 'a1b2']) {
      expect(validateName(n), n).toBeNull();
    }
  });
  it('lehnt alles andere ab', () => {
    for (const n of [
      '',
      'ab',
      'Abc',
      '1abc',
      'a_b',
      'a b',
      'abc-',
      '../x',
      'a'.repeat(41),
    ]) {
      expect(validateName(n), n).toMatch(/Name/);
    }
  });
});

describe('portBase', () => {
  it('liegt im Bereich 55400–59300, in 100er-Schritten, und ist stabil', () => {
    const b = portBase('vergabe-radar');
    expect(b % 100).toBe(0);
    expect(b).toBeGreaterThanOrEqual(55400);
    expect(b).toBeLessThanOrEqual(59300);
    expect(portBase('vergabe-radar')).toBe(b);
  });
  it('kollidiert nie mit dem Template-Bereich 553xx', () => {
    for (const n of [
      'a-b',
      'abc',
      'test-dummy',
      'x'.repeat(40),
      'vergabe-radar',
    ]) {
      expect(portBase(n)).not.toBe(55300);
    }
  });
});

describe('rewritePorts', () => {
  it('ersetzt nur 5532x-Ports', () => {
    const src =
      'port = 55321\nshadow_port = 55320\nurl=http://127.0.0.1:55324/api\nport = 3000\n';
    expect(rewritePorts(src, 57100)).toBe(
      'port = 57121\nshadow_port = 57120\nurl=http://127.0.0.1:57124/api\nport = 3000\n',
    );
  });
});

describe('sqlLiteral', () => {
  it('verdoppelt einfache Anführungszeichen', () => {
    expect(sqlLiteral("a'b")).toBe("'a''b'");
  });
  it('lehnt Nullbytes ab', () => {
    expect(() => sqlLiteral('a\u0000b')).toThrow();
  });
});

describe('buildChecklist', () => {
  const list = buildChecklist({
    name: 'demo',
    siteUrl: 'https://demo.vercel.app',
    supabaseRef: 'abcd',
    smtpConfigured: false,
  });
  it('enthält Stripe, Webhook-URL, Resend, Domain und Google-Redirect', () => {
    expect(list).toContain('https://demo.vercel.app/api/billing/webhook');
    expect(list).toMatch(/Stripe-Konto/);
    expect(list).toMatch(/Resend/);
    expect(list).toMatch(/Domain/);
    expect(list).toContain('https://abcd.supabase.co/auth/v1/callback');
  });
  it('lässt die Stripe-Schritte weg, wenn studio:new Stripe eingerichtet hat', () => {
    const auto = buildChecklist({
      name: 'demo',
      siteUrl: 'https://demo.vercel.app',
      supabaseRef: 'abcd',
      smtpConfigured: true,
      stripeConfigured: true,
    });
    expect(auto).not.toMatch(/Stripe-Konto|Webhook-Endpoint|Kundenportal/);
    expect(auto).toMatch(/Resend/);
  });
  it('weist auf fehlendes SMTP hin', () => {
    expect(list).toMatch(/SMTP/);
  });
});

describe('Stripe-Helfer', () => {
  it('formEncode kodiert verschachtelte Objekte und Arrays wie Stripe', () => {
    expect(
      formEncode({
        url: 'https://x.app/a?b=1',
        enabled_events: ['a.b', 'c.d'],
        metadata: { studio_project: 'acme' },
        recurring: { interval: 'month' },
        skip: undefined,
      }),
    ).toBe(
      'url=https%3A%2F%2Fx.app%2Fa%3Fb%3D1&enabled_events[0]=a.b&enabled_events[1]=c.d&metadata[studio_project]=acme&recurring[interval]=month',
    );
  });

  it('lehnt Live- und unbekannte Keys ab', () => {
    expect(stripeKeyError('sk_test_abc')).toBeNull();
    expect(stripeKeyError('rk_test_abc')).toBeNull();
    expect(stripeKeyError('sk_live_abc')).toMatch(/Live/);
    expect(stripeKeyError('pk_test_abc')).toMatch(/sk_test_/);
    // nie den Key selbst ausgeben
    expect(stripeKeyError('sk_live_TOPSECRET')).not.toContain('TOPSECRET');
  });

  it('priceBody rechnet Euro in Cent und setzt das Intervall nur für Abos', () => {
    const sub = priceBody('acme', 'pro', 'prod_1', {
      mode: 'subscription',
      priceMonthlyEur: 9.99,
    });
    expect(sub).toMatchObject({
      product: 'prod_1',
      currency: 'eur',
      unit_amount: 999,
      recurring: { interval: 'month' },
      lookup_key: 'acme_pro_999_month',
    });

    const once = priceBody('acme', 'lifetime', 'prod_2', {
      mode: 'payment',
      priceEur: 49,
    });
    expect(once.recurring).toBeUndefined();
    expect(once).toMatchObject({
      unit_amount: 4900,
      lookup_key: 'acme_lifetime_4900_once',
    });
  });
});
