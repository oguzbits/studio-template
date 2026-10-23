import { Suspense } from 'react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ChevronRight } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
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

const nextSteps = [
  {
    href: pathsConfig.app.billing,
    title: 'Billing',
    description: 'See your plan, payment status and invoices.',
  },
  {
    href: pathsConfig.app.profileSettings,
    title: 'Settings',
    description: 'Change your name, email, password and two-factor sign-in.',
  },
];

function HomeContent() {
  return (
    <>
      <PageHeader
        title={'Home'}
        description={`You are signed in to ${appConfig.name}.`}
      />

      <PageBody>
        <ul className={'border-border border-t'}>
          {nextSteps.map((step) => (
            <li key={step.href} className={'border-border border-b'}>
              <Link
                href={step.href}
                className={
                  'group hover:bg-muted/60 focus-visible:ring-ring -mx-2 flex items-center gap-4 rounded-md px-2 py-3.5 outline-none focus-visible:ring-2'
                }
              >
                <span className={'flex min-w-0 flex-1 flex-col gap-0.5'}>
                  <span className={'text-sm font-medium'}>{step.title}</span>
                  <span className={'text-muted-foreground text-sm'}>
                    {step.description}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden
                  className={
                    'text-muted-foreground group-hover:text-foreground size-4 shrink-0'
                  }
                />
              </Link>
            </li>
          ))}
        </ul>
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
