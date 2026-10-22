import 'server-only';

import { notFound } from 'next/navigation';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import studioConfig from '~/config/studio.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { computeMrr, isAdmin } from './metrics';

/** Guard for /admin: call in the layout AND the page/data loader. */
export async function requireAdmin() {
  const { id } = await requireUserInServerComponent();

  // JWT claims may carry an unconfirmed or stale (pre-change) email: read the auth record
  const { data, error } =
    await getSupabaseServerAdminClient().auth.admin.getUserById(id);
  const user = data?.user;

  if (
    error ||
    !user?.email_confirmed_at ||
    !isAdmin(user.email, process.env.ADMIN_EMAILS)
  ) {
    notFound();
  }

  return user;
}

type FailedJob = {
  id: string;
  type: string;
  attempts: number;
  last_error: string | null;
  run_at: string;
  created_at: string;
};

type Metrics = {
  signups_total: number;
  signups_30d: number;
  active_by_product: Record<string, number>;
  trialing_total: number;
  ai_cost_eur_30d: number;
  ai_unpriced_30d: number;
  failed_jobs: FailedJob[];
};

export async function loadAdminMetrics() {
  await requireAdmin();

  const { data, error } =
    await getSupabaseServerAdminClient().rpc('admin_metrics');

  if (error) {
    throw new Error('admin_metrics failed');
  }

  const m = data as unknown as Metrics;
  const products: Record<string, { mode: string; priceMonthlyEur?: number }> =
    studioConfig.products;
  const subs = Object.fromEntries(
    Object.entries(m.active_by_product).filter(
      ([key]) => products[key]?.mode === 'subscription',
    ),
  );

  return {
    ...m,
    subs,
    activeSubscriptions: Object.values(subs).reduce((a, b) => a + b, 0),
    mrr: computeMrr(subs, products),
  };
}
