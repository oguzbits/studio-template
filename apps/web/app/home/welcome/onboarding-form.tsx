import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import { completeOnboarding } from './onboarding-actions';

// Server component on purpose: both buttons are real submits of one form, so "Skip" works without JS.
export function OnboardingForm() {
  return (
    <form
      action={completeOnboarding}
      className={'border-border flex flex-col gap-y-6 border-t pt-6'}
    >
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

      <div className={'flex flex-wrap items-center gap-2'}>
        <Button
          type={'submit'}
          name={'intent'}
          value={'continue'}
          className={'h-10 px-4'}
        >
          Continue
        </Button>
        <Button
          type={'submit'}
          name={'intent'}
          value={'skip'}
          formNoValidate
          variant={'ghost'}
          className={'h-10 px-4'}
        >
          Skip
        </Button>
      </div>
    </form>
  );
}
