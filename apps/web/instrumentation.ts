/**
 * Monitoring instrumentation. Sentry is only initialised when SENTRY_DSN is set.
 */
import * as Sentry from '@sentry/nextjs';
import { type Instrumentation } from 'next';

export async function register() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const onRequestError: Instrumentation.onRequestError = (...args) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureRequestError(...args);
  }

  console.error(`Server Side Error:`, args[0]);
};
