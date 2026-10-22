import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { SiteHeader } from '~/(marketing)/_components/site-header';

export const generateMetadata = async () => {
  const t = await getTranslations();
  const title = t('common.notFound');

  return {
    title,
  };
};

const NotFoundPage = () => {
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
            <Trans i18nKey={'common.pageNotFound'} />
          </h1>

          <p className={'text-muted-foreground'}>
            <Trans i18nKey={'common.pageNotFoundSubHeading'} />
          </p>
        </div>

        <Link href={'/'} className={buttonVariants()}>
          <Trans i18nKey={'common.backToHomePage'} />
        </Link>
      </main>
    </div>
  );
};

export default NotFoundPage;
