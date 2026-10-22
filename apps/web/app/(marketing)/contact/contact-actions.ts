'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { enqueueJob } from '~/lib/jobs/enqueue';
import { rateLimit } from '~/lib/rate-limit';

// limits mirror the check constraints on contact_messages
const ContactSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  name: z
    .string()
    .trim()
    .max(100)
    .transform((name) => name || null),
  message: z.string().trim().min(1).max(2000),
});

export const submitContact = enhanceAction(
  async (formData: FormData) => {
    // before validation: junk submissions count too
    if (!(await rateLimit('contact', 3, 3600))) {
      return { ok: false, error: 'rate-limited' } as const;
    }

    const parsed = ContactSchema.safeParse({
      email: formData.get('email') ?? '',
      name: formData.get('name') ?? '',
      message: formData.get('message') ?? '',
    });

    if (!parsed.success) {
      return { ok: false, error: 'invalid' } as const;
    }

    const { data, error } = await getSupabaseServerAdminClient()
      .from('contact_messages')
      .insert(parsed.data)
      .select('id')
      .single();

    if (error || !data) {
      console.error('contact message insert failed', error?.message);

      return { ok: false, error: 'failed' } as const;
    }

    await enqueueJob('contact-notification', { messageId: data.id });

    return { ok: true } as const;
  },
  { auth: false },
);
