import 'server-only';

import { createElement } from 'react';

import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import appConfig from '~/config/app.config';
import { sendEmail } from '~/lib/email/send-email';
import { DigestEmail } from '~/lib/email/templates/digest';
import { getDigestItems } from '~/lib/jobs/digest-items';

import type { JobHandler } from '../registry';
import { loadUserEmail } from './load-user-email';

const PayloadSchema = z.object({ user_id: z.guid(), day: z.iso.date() });

// 23503: the user was deleted after the job was enqueued
const USER_GONE = '23503';

export const dailyDigest: JobHandler = async (payload) => {
  const { user_id: userId, day } = PayloadSchema.parse(payload);
  const client = getSupabaseServerAdminClient();
  const key = { user_id: userId, day };

  // the row reserves the send: a second job for the same day finds it and stops
  const { data: reserved, error } = await client
    .from('digest_sends')
    .upsert(key, { onConflict: 'user_id,day', ignoreDuplicates: true })
    .select('user_id')
    .maybeSingle();

  if (error?.code === USER_GONE) {
    return;
  }

  if (error) {
    throw new Error(`Reserving the digest failed: ${error.message}`, {
      cause: error,
    });
  }

  if (!reserved) {
    return;
  }

  try {
    const items = await getDigestItems(userId, day);

    // nothing to report today; the reservation stays so retries do not send either
    if (items.length === 0) {
      return;
    }

    const email = await loadUserEmail(userId);

    if (!email) {
      return;
    }

    await sendEmail({
      to: email,
      subject: `Your ${appConfig.name} digest for ${day}`,
      react: createElement(DigestEmail, { items, date: day }),
      idempotencyKey: `digest:${userId}:${day}`,
    });
  } catch (error) {
    // release the reservation so the retry sends
    const { error: deleteError } = await client
      .from('digest_sends')
      .delete()
      .match(key);

    if (deleteError) {
      (await getLogger()).error(
        { name: 'jobs.daily-digest', userId, day, error: deleteError },
        'Releasing the digest reservation failed, the digest will be skipped',
      );
    }

    throw error;
  }
};
