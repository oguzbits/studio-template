import { PageBody, PageHeader } from '@kit/ui/page';

import { OnboardingForm } from './onboarding-form';

export const metadata = { title: 'Welcome' };

export default function WelcomePage() {
  return (
    <>
      <PageHeader
        title={'Welcome'}
        description={'Tell us what to call you, or skip this step.'}
      />

      <PageBody>
        <div className={'w-full max-w-[480px]'}>
          <OnboardingForm />
        </div>
      </PageBody>
    </>
  );
}
