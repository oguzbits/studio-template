import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/** The user's email, or null when the user no longer exists. */
export async function loadUserEmail(userId: string) {
  const { data, error } =
    await getSupabaseServerAdminClient().auth.admin.getUserById(userId);

  if (error?.status === 404) {
    return null;
  }

  if (error) {
    throw new Error(`Loading user ${userId} failed: ${error.message}`, {
      cause: error,
    });
  }

  return data.user.email ?? null;
}
