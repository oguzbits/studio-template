import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { AuthCard, AuthHeading } from '@kit/auth/shared';
import { SignInMethodsContainer } from '@kit/auth/sign-in';
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
      <AuthHeading
        title={<Trans i18nKey={'auth.signInHeading'} />}
        subtitle={
          <Trans
            i18nKey={'auth.signInSubheading'}
            values={{ productName: process.env.NEXT_PUBLIC_PRODUCT_NAME }}
          />
        }
      />

      <AuthCard>
        <SignInMethodsContainer
          paths={paths}
          providers={authConfig.providers}
        />
      </AuthCard>

      <div className={'flex justify-center'}>
        <Link
          href={pathsConfig.auth.signUp}
          prefetch={false}
          className={
            'text-muted-foreground hover:text-foreground text-sm underline underline-offset-4'
          }
        >
          <Trans i18nKey={'auth.doNotHaveAccountYet'} />
        </Link>
      </div>
    </>
  );
}

export default SignInPage;
