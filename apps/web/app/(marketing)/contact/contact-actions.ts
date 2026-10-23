'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { enqueueJob } from '~/lib/jobs/enqueue';
import { rateLimit } from '~/lib/rate-limit';

// Postgres text cannot hold NUL: reject it here instead of failing the insert
const noNul = (value: string) => !value.includes('\0');

// limits mirror the check constraints on contact_messages
const ContactSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).refine(noNul).pipe(z.email()),
  name: z
    .string()
    .trim()
    .max(100)
    .refine(noNul)
    .transform((name) => name || null),
  message: z.string().trim().min(1).max(2000).refine(noNul),
});

export const submitContact = enhanceAction(
  async (formData: FormData) => {
    // before validation: junk submissions count too
    // shortcut: global cap of 30/hour also blocks real senders during a flood and does not group IPv6 /64; add Turnstile when that happens
    if (
      !(await rateLimit('contact', 3, 3600)) ||
      !(await rateLimit('contact', 30, 3600, { global: true }))
    ) {
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

    // the message is stored and visible in /admin; a queue failure must not turn into a retry that duplicates it
    try {
      await enqueueJob('contact-notification', { messageId: data.id });
    } catch (e) {
      console.error(
        'contact notification not enqueued',
        e instanceof Error ? e.message : 'unknown error',
      );
    }

    return { ok: true } as const;
  },
  { auth: false },
);
