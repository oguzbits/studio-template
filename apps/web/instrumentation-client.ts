import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

// Runs before app code: skip zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports as a violation.
z.config({ jitless: true });

// Only active with a DSN; otherwise no init and no network.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
