import Link from 'next/link';

import { Button } from '@kit/ui/button';

import { AuthGate } from '~/components/auth-gate';
import pathsConfig from '~/config/paths.config';
import { openPortal } from '~/lib/billing/checkout-actions';

import { pageMetadata } from '~/lib/page-metadata';

import { SitePageHeader } from '../../_components/site-page-header';

export const metadata = pageMetadata({
  path: '/kuendigen',
  title: 'Verträge kündigen',
});

function CancelPage() {
  return (
    <div>
      <SitePageHeader
        title={'Verträge kündigen'}
        subtitle={'Abonnements online beenden'}
      />

      <div className={'container mx-auto flex flex-col gap-6 py-8'}>
        <p className={'max-w-2xl'}>
          Du kannst deine Verträge hier jederzeit online kündigen. Nach der
          Anmeldung öffnet sich das Kundenportal, in dem du dein Abonnement
          beenden kannst. Die Kündigung wird zum Ende des bezahlten Zeitraums
          wirksam.
        </p>

        <div>
          <AuthGate
            signedIn={
              <form action={openPortal}>
                <Button type={'submit'}>Verträge hier kündigen</Button>
              </form>
            }
            signedOut={
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`${pathsConfig.auth.signIn}?next=${encodeURIComponent('/kuendigen')}`}
                  />
                }
              >
                Verträge hier kündigen
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default CancelPage;
