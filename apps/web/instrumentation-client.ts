import { z } from 'zod';

// Runs before app code: skip zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports as a violation.
z.config({ jitless: true });

// Only active with a DSN; otherwise no init, no network and no Sentry code in the bundle.
// Router transitions are not traced (tracesSampleRate 0), so no onRouterTransitionStart export.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import('@sentry/nextjs').then((Sentry) =>
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    }),
  );
}
