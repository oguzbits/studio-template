import { connection } from 'next/server';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

const ctx = { name: 'health.route' };
const DB_TIMEOUT_MS = 3000;

async function dbIsUp() {
  try {
    const { error } = await getSupabaseServerAdminClient()
      .from('jobs')
      .select('id', { head: true, count: 'estimated' })
      .abortSignal(AbortSignal.timeout(DB_TIMEOUT_MS));

    if (error) {
      (await getLogger()).error(
        { ...ctx, code: error.code },
        'db check failed',
      );
    }

    return !error;
  } catch {
    (await getLogger()).error(ctx, 'db check threw');

    return false;
  }
}

export async function GET() {
  await connection();

  const db = (await dbIsUp()) ? 'ok' : 'down';
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'dev';

  return Response.json(
    { ok: db === 'ok', db, version },
    {
      status: db === 'ok' ? 200 : 503,
      headers: { 'cache-control': 'no-store' },
    },
  );
}
