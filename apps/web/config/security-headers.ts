/**
 * Response headers for every route, applied via `headers()` in next.config.ts.
 * Evaluated at build time, so every input must be available to `next build`.
 */
type SecurityHeaderOptions = {
  supabaseUrl?: string;
  sentryDsn?: string;
  analyticsSrc?: string;
  captcha?: boolean;
  isDev: boolean;
  reportOnly: boolean;
};

const origin = (url?: string) => (url ? new URL(url).origin : undefined);

export function securityHeaders(options: SecurityHeaderOptions) {
  const supabase = origin(options.supabaseUrl);
  const analytics = origin(options.analyticsSrc);
  const turnstile = options.captcha
    ? 'https://challenges.cloudflare.com'
    : undefined;

  // shortcut: 'unsafe-inline' instead of nonces, which would make every page dynamic;
  // switch to nonces once a product renders user-supplied HTML.
  const directives: Record<string, (string | undefined | false)[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      options.isDev && "'unsafe-eval'",
      analytics,
      turnstile,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      supabase,
      supabase?.replace(/^http/, 'ws'),
      origin(options.sentryDsn),
      analytics,
    ],
    'frame-src': ["'self'", turnstile],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': [
      "'self'",
      'https://checkout.stripe.com',
      'https://billing.stripe.com',
    ],
  };

  const csp = [
    ...Object.entries(directives).map(([name, sources]) =>
      [name, ...sources.filter(Boolean)].join(' '),
    ),
    ...(options.isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  return [
    {
      key: options.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy',
      value: csp,
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
}
