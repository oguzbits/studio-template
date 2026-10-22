import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

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
    <div className={'flex min-h-svh flex-col'}>
      <SiteHeader />

      <main
        className={
          'container flex flex-1 flex-col items-center justify-center gap-y-10 pb-20 text-center'
        }
      >
        <div className={'flex max-w-5xl flex-col items-center gap-y-6'}>
          <h1
            className={
              'font-display text-[clamp(2.75rem,0.5rem+6.4vw,7rem)] leading-[0.98] font-normal tracking-[-0.03em] text-balance'
            }
          >
            <Trans i18nKey={'common.pageNotFound'} />
          </h1>

          <p className={'text-muted-foreground text-xl'}>
            <Trans i18nKey={'common.pageNotFoundSubHeading'} />
          </p>
        </div>

        <Link
          href={'/'}
          className={cn(buttonVariants(), 'h-12 px-6 text-base')}
        >
          <Trans i18nKey={'common.backToHomePage'} />
        </Link>
      </main>
    </div>
  );
};

export default NotFoundPage;
