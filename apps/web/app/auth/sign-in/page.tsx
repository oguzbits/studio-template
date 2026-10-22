import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { SignInMethodsContainer } from '@kit/auth/sign-in';
import { buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { pageMetadata } from '~/lib/page-metadata';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return pageMetadata({ path: '/auth/sign-in', title: t('auth.signIn') });
};

const paths = {
  callback: pathsConfig.auth.callback,
  home: pathsConfig.app.home,
};

function SignInPage() {
  return (
    <>
      <div className={'flex flex-col items-center'}>
        <Heading level={2} className={'text-2xl tracking-tight lg:text-2xl'}>
          <Trans
            i18nKey={'auth.signInHeading'}
            values={{ productName: process.env.NEXT_PUBLIC_PRODUCT_NAME }}
          />
        </Heading>
      </div>

      <SignInMethodsContainer paths={paths} providers={authConfig.providers} />

      <div className={'flex justify-center'}>
        <Link
          href={pathsConfig.auth.signUp}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: 'link', size: 'sm' }),
            'underline',
          )}
        >
          <Trans i18nKey={'auth.doNotHaveAccountYet'} />
        </Link>
      </div>
    </>
  );
}

export default SignInPage;
