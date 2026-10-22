import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { PasswordResetRequestContainer } from '@kit/auth/password-reset';
import { AuthCard, AuthHeading } from '@kit/auth/shared';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { pageMetadata } from '~/lib/page-metadata';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return pageMetadata({
    path: '/auth/password-reset',
    title: t('auth.passwordResetLabel'),
  });
};

const { callback, passwordUpdate, signIn } = pathsConfig.auth;
const redirectPath = `${callback}?next=${passwordUpdate}`;

function PasswordResetPage() {
  return (
    <>
      <AuthHeading
        title={<Trans i18nKey={'auth.passwordResetLabel'} />}
        subtitle={<Trans i18nKey={'auth.passwordResetSubheading'} />}
      />

      <AuthCard>
        <PasswordResetRequestContainer redirectPath={redirectPath} />
      </AuthCard>

      <div className={'flex justify-center'}>
        <Link
          href={signIn}
          prefetch={false}
          className={
            'text-muted-foreground hover:text-foreground text-sm underline underline-offset-4'
          }
        >
          <Trans i18nKey={'auth.passwordRecoveredQuestion'} />
        </Link>
      </div>
    </>
  );
}

export default PasswordResetPage;
