import { timingSafeEqual } from 'node:crypto';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { runWorker } from '~/lib/jobs/worker';

export const maxDuration = 60;

const ctx = { name: 'jobs.worker.route' };

// pg_cron (pg_net) POSTs every minute; Vercel Cron GETs daily with ?daily=1
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    (await getLogger()).error(ctx, 'CRON_SECRET is not set');

    return new Response('Worker not configured', { status: 500 });
  }

  if (!isAuthorized(request.headers.get('authorization'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (new URL(request.url).searchParams.get('daily') === '1') {
    const { error } = await getSupabaseServerAdminClient().rpc(
      'enqueue_daily_digests',
    );

    if (error) {
      (await getLogger()).error(
        { ...ctx, error },
        'enqueue_daily_digests failed',
      );

      return new Response('Database error', { status: 500 });
    }
  }

  return Response.json(await runWorker());
}

function isAuthorized(header: string | null, secret: string) {
  const actual = Buffer.from(header ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
