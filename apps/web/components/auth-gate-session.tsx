'use client';

import type { ReactNode } from 'react';

import { useUser } from '@kit/supabase/hooks/use-user';

export function AuthGateSession(props: {
  signedIn: ReactNode;
  signedOut: ReactNode;
}) {
  const { data: user } = useUser();

  return user ? props.signedIn : props.signedOut;
}
