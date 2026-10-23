'use client';

import { useActionState } from 'react';

import { AuthCard } from '@kit/auth/shared';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import { submitContact } from './contact-actions';

type Values = { email: string; name: string; message: string };
type State = {
  status: 'idle' | 'done' | 'invalid' | 'limited' | 'failed';
  values: Values;
};

const empty: Values = { email: '', name: '', message: '' };

const errors = {
  invalid: 'Please check your email and message (up to 2000 characters).',
  limited: 'Too many messages, please try again later.',
  failed: 'Something went wrong, please try again.',
} as const;

export function ContactForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      // kept so a failed submit does not wipe what the person typed
      const values: Values = {
        email: String(formData.get('email') ?? ''),
        name: String(formData.get('name') ?? ''),
        message: String(formData.get('message') ?? ''),
      };

      try {
        const result = await submitContact(formData);

        if (result.ok) return { status: 'done', values: empty };

        const status = {
          'rate-limited': 'limited',
          failed: 'failed',
          invalid: 'invalid',
        } as const;

        return { status: status[result.error], values };
      } catch {
        return { status: 'failed', values };
      }
    },
    { status: 'idle', values: empty },
  );

  if (state.status === 'done') {
    return (
      <AuthCard>
        {/* focus moves here so screen readers announce the result */}
        <p
          role={'status'}
          tabIndex={-1}
          ref={(el) => el?.focus()}
          className={'text-lg outline-none'}
        >
          Thanks, your message is on its way. We will answer by email.
        </p>
      </AuthCard>
    );
  }

  const error = state.status === 'idle' ? null : errors[state.status];

  return (
    <form action={action}>
      <AuthCard>
        <div className={'flex flex-col gap-y-2.5'}>
          <Label htmlFor={'contact-email'}>Email</Label>
          <Input
            id={'contact-email'}
            name={'email'}
            type={'email'}
            autoComplete={'email'}
            required
            maxLength={254}
            defaultValue={state.values.email}
            className={'h-10'}
          />
        </div>

        <div className={'flex flex-col gap-y-2.5'}>
          <Label htmlFor={'contact-name'}>Name (optional)</Label>
          <Input
            id={'contact-name'}
            name={'name'}
            autoComplete={'name'}
            maxLength={100}
            defaultValue={state.values.name}
            className={'h-10'}
          />
        </div>

        <div className={'flex flex-col gap-y-2.5'}>
          <Label htmlFor={'contact-message'}>Message</Label>
          <Textarea
            id={'contact-message'}
            name={'message'}
            required
            rows={6}
            maxLength={2000}
            defaultValue={state.values.message}
            className={'min-h-32'}
          />
        </div>

        {error && (
          <p role={'alert'} className={'text-destructive text-sm'}>
            {error}
          </p>
        )}

        <Button
          type={'submit'}
          disabled={pending}
          className={'h-11 w-full text-base'}
        >
          Send message
        </Button>
      </AuthCard>
    </form>
  );
}
