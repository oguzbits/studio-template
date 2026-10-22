'use client';

import { useActionState } from 'react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';

import { joinWaitlist } from './waitlist-actions';

type State = 'idle' | 'done' | 'invalid' | 'failed';

export function WaitlistForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      try {
        const result = await joinWaitlist(formData);

        return result.ok ? 'done' : 'invalid';
      } catch {
        return 'failed';
      }
    },
    'idle',
  );

  if (state === 'done') {
    return <p>Thanks, you are on the list.</p>;
  }

  return (
    <form action={action} className={'flex w-full max-w-md flex-col gap-2'}>
      <div className={'flex gap-2'}>
        <Input
          name={'email'}
          type={'email'}
          required
          placeholder={'you@example.com'}
          aria-label={'Email'}
        />

        <Button type={'submit'} disabled={pending}>
          Join waitlist
        </Button>
      </div>

      {state === 'invalid' && (
        <p className={'text-destructive text-sm'}>
          Please enter a valid email.
        </p>
      )}
      {state === 'failed' && (
        <p className={'text-destructive text-sm'}>
          Something went wrong, please try again.
        </p>
      )}
    </form>
  );
}
