'use client';

import Link from 'next/link';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { SiteHeader } from '~/(marketing)/_components/site-header';

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  console.error(error);

  return (
    <div className={'flex min-h-screen flex-col'}>
      <SiteHeader />

      <main
        className={
          'flex flex-1 flex-col items-center justify-center gap-y-6 px-4 text-center'
        }
      >
        <div className={'flex max-w-md flex-col gap-y-2'}>
          <h1 className={'font-heading text-3xl font-semibold tracking-tight'}>
            <Trans i18nKey={'common.genericError'} />
          </h1>

          <p className={'text-muted-foreground'}>
            <Trans i18nKey={'common.genericErrorSubHeading'} />
          </p>
        </div>

        <div className={'flex gap-x-3'}>
          <Button nativeButton={false} render={<Link href={'/'} />}>
            <Trans i18nKey={'common.backToHomePage'} />
          </Button>

          <Button variant={'outline'} onClick={reset}>
            <Trans i18nKey={'common.tryAgain'} />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage;
