import 'server-only';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { handlers } from './registry';
import { retryDelayMs } from './retry';

// mirrors the limit in public.fail_job
const MAX_ATTEMPTS = 5;
const MAX_ERROR_LENGTH = 2000;

const ctx = { name: 'jobs.worker' };

export async function runWorker({
  limit = 10,
  now = new Date(),
}: { limit?: number; now?: Date } = {}): Promise<{
  done: number;
  failed: number;
  retried: number;
}> {
  const client = getSupabaseServerAdminClient();
  const logger = await getLogger();
  const result = { done: 0, failed: 0, retried: 0 };

  const { data: jobs, error } = await client.rpc('claim_jobs', {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`claim_jobs failed: ${error.message}`, { cause: error });
  }

  for (const job of jobs) {
    try {
      const handler = handlers.get(job.type);

      if (!handler) {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      await handler(job.payload, { now });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const final = job.attempts >= MAX_ATTEMPTS;

      logger.warn(
        { ...ctx, jobId: job.id, type: job.type, error },
        'Job failed',
      );

      const { error: failError } = await client.rpc('fail_job', {
        p_id: job.id,
        p_error: message.slice(0, MAX_ERROR_LENGTH),
        p_retry_at: new Date(
          now.getTime() + retryDelayMs(job.attempts),
        ).toISOString(),
      });

      // the job is reclaimed after its visibility timeout
      if (failError) {
        logger.error(
          { ...ctx, jobId: job.id, error: failError },
          'fail_job failed',
        );
      }

      result[final ? 'failed' : 'retried']++;
      continue;
    }

    const { error: completeError } = await client.rpc('complete_job', {
      p_id: job.id,
    });

    if (completeError) {
      logger.error(
        { ...ctx, jobId: job.id, error: completeError },
        'complete_job failed, the job will run again',
      );
    } else {
      result.done++;
    }
  }

  return result;
}
