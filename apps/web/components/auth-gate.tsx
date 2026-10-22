'use client';

import { type ReactNode, Suspense, lazy } from 'react';

import { useSessionCookie } from '~/components/use-session-cookie';

const AuthGateSession = lazy(() =>
  import('~/components/auth-gate-session').then((mod) => ({
    default: mod.AuthGateSession,
  })),
);

/**
 * Picks by session on the client, like the site header, so marketing pages stay
 * identical for every visitor on the server. Shows `signedOut` until resolved;
 * the Supabase client only loads when a session cookie exists.
 */
export function AuthGate(props: { signedIn: ReactNode; signedOut: ReactNode }) {
  if (!useSessionCookie()) {
    return props.signedOut;
  }

  // useSessionCookie is false on the server, so the lazy chunk only loads on the client
  return (
    <Suspense fallback={props.signedOut}>
      <AuthGateSession {...props} />
    </Suspense>
  );
}
