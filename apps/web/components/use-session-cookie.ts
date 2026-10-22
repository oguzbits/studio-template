'use client';

import { useSyncExternalStore } from 'react';

const noSubscription = () => () => {};

/**
 * Whether a Supabase auth cookie (`sb-<ref>-auth-token`, readable by design of
 * @supabase/ssr) exists. Without it the visitor is signed out, so marketing
 * pages skip loading the Supabase client. False on the server and during
 * hydration, so the HTML is identical for every visitor.
 */
export function useSessionCookie() {
  return useSyncExternalStore(
    noSubscription,
    () => document.cookie.includes('-auth-token'),
    () => false,
  );
}
