import { Suspense } from 'react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { buttonVariants } from '@kit/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { needsOnboarding } from './welcome/needs-onboarding';

export const metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <>
      <Suspense>
        <OnboardingGate>
          <HomeContent />
        </OnboardingGate>
      </Suspense>
    </>
  );
}

function HomeContent() {
  return (
    <>
      <PageHeader title={'Home'} description={`Welcome to ${appConfig.name}`} />

      <PageBody>
        <Card className={'w-full lg:max-w-2xl'}>
          <CardHeader>
            <CardTitle>You are all set</CardTitle>
            <CardDescription>
              Manage your plan and invoices in Billing, or update your profile
              in Settings.
            </CardDescription>
          </CardHeader>

          <CardFooter className={'gap-2'}>
            <Link href={pathsConfig.app.billing} className={buttonVariants()}>
              Billing
            </Link>
            <Link
              href={pathsConfig.app.profileSettings}
              className={buttonVariants({ variant: 'outline' })}
            >
              Settings
            </Link>
          </CardFooter>
        </Card>
      </PageBody>
    </>
  );
}

// Only this index page sends people to /home/welcome (no other route, so buyers going
// straight to billing are not held up). The JWT claims can be stale right after the
// flag is set, so the fresh user record is read.
async function OnboardingGate({ children }: { children: React.ReactNode }) {
  await requireUserInServerComponent();

  const { data } = await getSupabaseServerClient().auth.getUser();

  if (data.user && needsOnboarding(data.user)) {
    redirect('/home/welcome');
  }

  // content renders only after the check, so nothing flashes before the redirect
  return children;
}
