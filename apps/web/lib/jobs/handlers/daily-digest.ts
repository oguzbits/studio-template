import 'server-only';

import { createElement } from 'react';

import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import appConfig from '~/config/app.config';
import { sendEmail } from '~/lib/email/send-email';
import { DigestEmail } from '~/lib/email/templates/digest';
import { getDigestItems } from '~/lib/jobs/digest-items';

import type { JobHandler } from '../registry';
import { loadUserEmail } from './load-user-email';

const PayloadSchema = z.object({ user_id: z.guid(), day: z.iso.date() });

// 23503: the user was deleted while the digest was being sent
const USER_GONE = '23503';

/*
 * Send first, record after. A crash between the two only means the retry sends
 * again, and the Resend idempotency key (24 h window) turns that, like any
 * concurrent duplicate job, into the same single email. digest_sends only lets
 * later jobs for the day stop early.
 */
export const dailyDigest: JobHandler = async (payload) => {
  const { user_id: userId, day } = PayloadSchema.parse(payload);
  const client = getSupabaseServerAdminClient();
  const key = { user_id: userId, day };

  const { data: sent, error } = await client
    .from('digest_sends')
    .select('user_id')
    .match(key)
    .maybeSingle();

  if (error) {
    throw new Error(`Loading the digest record failed: ${error.message}`, {
      cause: error,
    });
  }

  if (sent) {
    return;
  }

  const items = await getDigestItems(userId, day);

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

  const { error: recordError } = await client
    .from('digest_sends')
    .upsert(key, { onConflict: 'user_id,day', ignoreDuplicates: true });

  // a failed record retries the job; the idempotency key keeps the resend a no-op
  if (recordError && recordError.code !== USER_GONE) {
    throw new Error(`Recording the digest failed: ${recordError.message}`, {
      cause: recordError,
    });
  }
};
