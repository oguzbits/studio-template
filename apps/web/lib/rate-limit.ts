import 'server-only';

import { createHash } from 'node:crypto';

import { headers } from 'next/headers';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

// x-real-ip is set by the platform; the first x-forwarded-for entry can be forged by the client
// shortcut: trusts x-real-ip as set by Vercel; behind another proxy configure it to overwrite x-real-ip, else clients can rotate it
export function rateLimitKey(scope: string, headers: Headers) {
  const ip =
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  // shortcut: ungesalzener IPv4-Hash ist per Brute Force umkehrbar, Einträge leben max. 1 Tag; bei Bedarf HMAC mit eigenem Secret
  return `${scope}:${createHash('sha256').update(ip).digest('hex')}`;
}

// true = allowed; fails open so a broken counter never blocks the caller
export async function rateLimit(
  scope: string,
  max: number,
  windowSec: number,
  { global = false }: { global?: boolean } = {},
) {
  const { data, error } = await getSupabaseServerAdminClient().rpc(
    'check_rate_limit',
    {
      p_key: global ? `${scope}:all` : rateLimitKey(scope, await headers()),
      p_max: max,
      p_window_seconds: windowSec,
    },
  );

  if (error) {
    console.error('rate limit check failed', error);
    return true;
  }

  return data;
}
