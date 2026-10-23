import { AuthCard } from '@kit/auth/shared';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import { completeOnboarding } from './onboarding-actions';

// Server component on purpose: both buttons are real submits of one form, so "Skip" works without JS.
export function OnboardingForm() {
  return (
    <form action={completeOnboarding}>
      <AuthCard>
        <div className={'flex flex-col gap-y-2.5'}>
          <Label htmlFor={'onboarding-name'}>Your name (optional)</Label>
          <Input
            id={'onboarding-name'}
            name={'name'}
            autoComplete={'name'}
            minLength={2}
            maxLength={80}
            className={'h-10'}
          />
        </div>

        <div className={'flex flex-col gap-y-2.5'}>
          <Button
            type={'submit'}
            name={'intent'}
            value={'continue'}
            className={'h-11 w-full text-base'}
          >
            Continue
          </Button>
          <Button
            type={'submit'}
            name={'intent'}
            value={'skip'}
            formNoValidate
            variant={'ghost'}
            className={'h-11 w-full text-base'}
          >
            Skip
          </Button>
        </div>
      </AuthCard>
    </form>
  );
}
