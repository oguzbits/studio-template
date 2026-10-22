import 'server-only';

import { createElement } from 'react';

import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { sendEmail } from '~/lib/email/send-email';
import { ContactMessageEmail } from '~/lib/email/templates/contact-message';

import type { JobHandler } from '../registry';

const PayloadSchema = z.object({ messageId: z.guid() });

export const contactNotification: JobHandler = async (payload) => {
  const { messageId } = PayloadSchema.parse(payload);

  // shortcut: only the first ADMIN_EMAILS entry gets the mail; add a list when several people answer
  const to = process.env.ADMIN_EMAILS?.split(',')
    .map((s) => s.trim())
    .find(Boolean);

  // not an error: the message stays visible in /admin
  if (!to) {
    console.warn('ADMIN_EMAILS empty, contact notification not sent');

    return;
  }

  const { data, error } = await getSupabaseServerAdminClient()
    .from('contact_messages')
    .select('id, email, name, message')
    .eq('id', messageId)
    .maybeSingle();

  if (error) {
    throw new Error(`Loading contact message failed: ${error.message}`, {
      cause: error,
    });
  }

  if (!data) {
    return;
  }

  await sendEmail({
    to,
    subject: `New contact message from ${data.email}`,
    react: createElement(ContactMessageEmail, data),
    replyTo: data.email,
    idempotencyKey: `contact:${data.id}`,
  });
};
