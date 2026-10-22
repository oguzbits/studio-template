// Only active with a DSN; otherwise no init, no network and no Sentry code in the bundle.
// Router transitions are not traced (tracesSampleRate 0), so no onRouterTransitionStart export.
// shortcut: Sentry starts async, errors before the import resolves (early hydration) are missed; switch to a static import in projects that set a DSN
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import('@sentry/nextjs').then((Sentry) =>
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    }),
  );
}
