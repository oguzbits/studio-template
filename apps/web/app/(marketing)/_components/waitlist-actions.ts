'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

const EmailSchema = z.string().trim().toLowerCase().pipe(z.email());

// shortcut: öffentlich ohne Rate-Limit/Captcha (Tabelle kann zugespammt werden), bei Missbrauch `captcha: true` (Turnstile, CAPTCHA_SECRET_TOKEN) aktivieren
export const joinWaitlist = enhanceAction(
  async (formData: FormData) => {
    const parsed = EmailSchema.safeParse(formData.get('email'));

    if (!parsed.success) {
      return { ok: false, error: 'invalid-email' } as const;
    }

    const { error } = await getSupabaseServerAdminClient()
      .from('waitlist')
      .upsert(
        { email: parsed.data },
        { onConflict: 'email', ignoreDuplicates: true },
      );

    if (error) {
      throw error;
    }

    // identical for new and known addresses: no way to probe the list
    return { ok: true } as const;
  },
  { auth: false },
);
