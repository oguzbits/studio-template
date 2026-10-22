import { describe, expect, it } from 'vitest';

import { securityHeaders } from './security-headers';

const base = {
  supabaseUrl: 'https://abc.supabase.co',
  isDev: false,
  reportOnly: false,
};

function csp(options: Partial<Parameters<typeof securityHeaders>[0]> = {}) {
  const headers = securityHeaders({ ...base, ...options });
  const value = headers.find((h) =>
    h.key.startsWith('Content-Security-Policy'),
  )!;

  return {
    headers,
    key: value.key,
    directives: Object.fromEntries(
      value.value.split('; ').map((d) => {
        const [name, ...sources] = d.split(' ');
        return [name, sources.join(' ')];
      }),
    ),
  };
}

describe('securityHeaders', () => {
  it('blocks framing, plugins and foreign base URLs', () => {
    const { directives } = csp();

    expect(directives['frame-ancestors']).toBe("'none'");
    expect(directives['object-src']).toBe("'none'");
    expect(directives['base-uri']).toBe("'self'");
    expect(directives['default-src']).toBe("'self'");
  });

  it('sets the non-CSP headers', () => {
    const headers = Object.fromEntries(
      csp().headers.map((h) => [h.key, h.value]),
    );

    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('allows unsafe-eval only in development', () => {
    expect(csp().directives['script-src']).not.toContain('unsafe-eval');
    expect(csp({ isDev: true }).directives['script-src']).toContain(
      "'unsafe-eval'",
    );
  });

  it('lets the browser reach Supabase over https and wss', () => {
    expect(csp().directives['connect-src']).toBe(
      "'self' https://abc.supabase.co wss://abc.supabase.co",
    );
  });

  it('adds Sentry and analytics hosts only when configured', () => {
    expect(csp().directives['script-src']).toBe("'self' 'unsafe-inline'");

    const { directives } = csp({
      sentryDsn: 'https://key@o1.ingest.de.sentry.io/2',
      analyticsSrc: 'https://plausible.io/js/script.js',
    });

    expect(directives['connect-src']).toContain(
      'https://o1.ingest.de.sentry.io',
    );
    expect(directives['connect-src']).not.toContain('key@');
    expect(directives['connect-src']).toContain('https://plausible.io');
    expect(directives['script-src']).toContain('https://plausible.io');
  });

  it('allows Stripe as form target for checkout and portal redirects', () => {
    expect(csp().directives['form-action']).toBe(
      "'self' https://checkout.stripe.com https://billing.stripe.com",
    );
  });

  it('switches to report-only on request', () => {
    expect(csp({ reportOnly: true }).key).toBe(
      'Content-Security-Policy-Report-Only',
    );
    expect(csp().key).toBe('Content-Security-Policy');
  });
});
