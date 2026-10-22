'use client';

import type { ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { useSessionCookie } from '~/components/use-session-cookie';

const AuthGateSession = dynamic(
  () =>
    import('~/components/auth-gate-session').then((mod) => ({
      default: mod.AuthGateSession,
    })),
  { ssr: false },
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

  return <AuthGateSession {...props} />;
}
