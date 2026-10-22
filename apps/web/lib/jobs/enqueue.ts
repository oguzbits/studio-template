import 'server-only';

import type { Json } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export async function enqueueJob(
  type: string,
  payload: NonNullable<Json>,
  runAt?: Date,
) {
  const { error } = await getSupabaseServerAdminClient()
    .from('jobs')
    .insert({ type, payload, run_at: runAt?.toISOString() });

  if (error) {
    throw new Error(`enqueueJob failed: ${error.message}`, { cause: error });
  }
}
