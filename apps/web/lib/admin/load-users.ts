import 'server-only';

import type { User } from '@supabase/supabase-js';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { accessDecision } from '~/lib/billing/status';
import type { Entitlement } from '~/lib/billing/status';

import { requireAdmin } from './load-metrics';

const PER_PAGE = 50;

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmed: boolean;
  plan: string | null;
  status: string | null;
};

type EntitlementRow = Pick<
  Entitlement,
  'user_id' | 'product_key' | 'status' | 'current_period_end' | 'updated_at'
>;

export function mergeUsers(
  users: Pick<User, 'id' | 'email' | 'created_at' | 'email_confirmed_at'>[],
  entitlements: EntitlementRow[],
  now = new Date(),
): AdminUserRow[] {
  const best = new Map<string, EntitlementRow>();

  for (const e of entitlements) {
    const current = best.get(e.user_id);

    if (!current || isBetter(e, current, now)) best.set(e.user_id, e);
  }

  return users.map((u) => {
    const e = best.get(u.id);

    return {
      id: u.id,
      email: u.email ?? '',
      createdAt: u.created_at,
      emailConfirmed: Boolean(u.email_confirmed_at),
      plan: e?.product_key ?? null,
      status: e?.status ?? null,
    };
  });
}

// with access wins; among equals the most recently updated
function isBetter(a: EntitlementRow, b: EntitlementRow, now: Date) {
  const accessA = accessDecision(a, now) === 'allow';
  const accessB = accessDecision(b, now) === 'allow';

  if (accessA !== accessB) return accessA;

  return a.updated_at > b.updated_at;
}

export async function loadAdminUsers(page: number) {
  await requireAdmin();

  // upper bound: GoTrue fails on absurd page numbers
  const current =
    Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const admin = getSupabaseServerAdminClient();

  const { data, error } = await admin.auth.admin.listUsers({
    page: current,
    perPage: PER_PAGE,
  });

  if (error) {
    throw new Error('listUsers failed');
  }

  const users = data.users;
  let entitlements: EntitlementRow[] = [];

  if (users.length > 0) {
    const res = await admin
      .from('entitlements')
      .select('user_id, product_key, status, current_period_end, updated_at')
      .in(
        'user_id',
        users.map((u) => u.id),
      );

    if (res.error) {
      throw new Error('entitlements query failed');
    }

    entitlements = res.data;
  }

  return {
    rows: mergeUsers(users, entitlements),
    // x-total-count of the GoTrue API; its link-header page numbers break past page 9
    hasMore: current * PER_PAGE < data.total,
  };
}
