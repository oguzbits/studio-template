'use client';

import type { ReactNode } from 'react';

import { useUser } from '@kit/supabase/hooks/use-user';

/**
 * Picks by session on the client, like the site header, so marketing pages stay
 * identical for every visitor on the server. Shows `signedOut` until resolved.
 */
export function AuthGate(props: { signedIn: ReactNode; signedOut: ReactNode }) {
  const { data: user } = useUser();

  return user ? props.signedIn : props.signedOut;
}
