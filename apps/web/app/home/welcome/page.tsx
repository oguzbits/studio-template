import { PageBody, PageHeader } from '@kit/ui/page';

import { OnboardingForm } from './onboarding-form';

export const metadata = { title: 'Welcome' };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <PageHeader
        title={'Welcome'}
        description={'Tell us what to call you, or skip this step.'}
      />

      <PageBody>
        <div className={'w-full max-w-[480px]'}>
          {error === 'name' && (
            <p role={'alert'} className={'text-destructive mb-4 text-sm'}>
              Please enter a name of 2 to 80 characters, or skip this step.
            </p>
          )}
          <OnboardingForm />
        </div>
      </PageBody>
    </>
  );
}
