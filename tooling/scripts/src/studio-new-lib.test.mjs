import { describe, expect, it } from 'vitest';

import {
  buildChecklist,
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
  it('weist auf fehlendes SMTP hin', () => {
    expect(list).toMatch(/SMTP/);
  });
});
