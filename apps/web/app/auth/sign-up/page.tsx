import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { AuthCard, AuthHeading } from '@kit/auth/shared';
import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { pageMetadata } from '~/lib/page-metadata';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return pageMetadata({ path: '/auth/sign-up', title: t('auth.signUp') });
};

const paths = {
  callback: pathsConfig.auth.callback,
  appHome: pathsConfig.app.home,
};

function SignUpPage() {
  return (
    <>
      <AuthHeading
        title={<Trans i18nKey={'auth.signUpHeading'} />}
        subtitle={<Trans i18nKey={'auth.signUpSubheading'} />}
      />

      <AuthCard>
        <SignUpMethodsContainer
          providers={authConfig.providers}
          displayTermsCheckbox={authConfig.displayTermsCheckbox}
          paths={paths}
        />
      </AuthCard>

      <div className={'flex justify-center'}>
        <Link
          href={pathsConfig.auth.signIn}
          prefetch={false}
          className={
            'text-muted-foreground hover:text-foreground text-sm underline underline-offset-4'
          }
        >
          <Trans i18nKey={'auth.alreadyHaveAnAccount'} />
        </Link>
      </div>
    </>
  );
}

export default SignUpPage;
