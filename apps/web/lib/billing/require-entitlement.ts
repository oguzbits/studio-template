import 'server-only';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import type { ProductKey } from '~/config/studio.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { type Entitlement, accessDecision } from './status';

export const PRICING_PATH = '/pricing';

/**
 * Redirects to sign-in (no session), /home/billing (payment problem) or
 * /pricing (no or ended entitlement); otherwise returns the entitlement.
 */
export async function requireEntitlement(
  productKey: ProductKey,
): Promise<Entitlement> {
  const user = await requireUserInServerComponent();

  const { data, error } = await getSupabaseServerClient()
    .from('entitlements')
    .select('*')
    .eq('user_id', user.id)
    .eq('product_key', productKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const decision = accessDecision(data, new Date());

  if (!data || decision !== 'allow') {
    redirect(decision === 'billing' ? pathsConfig.app.billing : PRICING_PATH);
  }

  return data;
}
