'use server';

import { redirect } from 'next/navigation';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// empty name = none; otherwise same lower bound as AccountDetailsSchema (profile form)
const NameSchema = z
  .string()
  .trim()
  .max(80)
  .refine((name) => name === '' || name.length >= 2);

export const completeOnboarding = enhanceAction(
  async (formData: FormData, user) => {
    // "Skip" is a submit button of the same form: a typed name is ignored then
    const name =
      formData.get('intent') === 'skip'
        ? ''
        : NameSchema.parse(String(formData.get('name') ?? ''));
    const client = getSupabaseServerClient();

    if (name) {
      // same write as useUpdateAccountData (UpdateAccountDetailsForm), here with the user's own session
      const { error } = await client
        .from('accounts')
        .update({ name })
        .match({ id: user.id });

      if (error) throw new Error('saving the name failed');
    }

    const { error } = await client.auth.updateUser({
      data: { onboarded: true },
    });

    if (error) throw new Error('saving the onboarding flag failed');

    redirect('/home');
  },
  { auth: true },
);
