import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

import { UpdatePasswordForm } from '@kit/auth/password-reset';
import { AuthCard, AuthLayoutShell } from '@kit/auth/shared';

import { AuthProvider } from '~/components/auth-provider';
import { Wordmark } from '~/components/wordmark';
import { ZodJitless } from '~/components/zod-jitless';
import { AuthFormSkeleton } from '~/components/skeletons/page-skeletons';
import pathsConfig from '~/config/paths.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return {
    title: t('auth.updatePassword'),
  };
};

const Logo = () => <Wordmark />;

interface UpdatePasswordPageProps {
  searchParams: Promise<{
    callback?: string;
  }>;
}

/**
 * The shell renders immediately. The session check and the searchParams read
 * both happen inside the boundary.
 */
function UpdatePasswordPage(props: UpdatePasswordPageProps) {
  return (
    <ZodJitless>
      <AuthProvider>
        <AuthLayoutShell Logo={Logo}>
          <Suspense fallback={<AuthFormSkeleton />}>
            <UpdatePassword searchParams={props.searchParams} />
          </Suspense>
        </AuthLayoutShell>
      </AuthProvider>
    </ZodJitless>
  );
}

async function UpdatePassword(props: UpdatePasswordPageProps) {
  await requireUserInServerComponent();

  const { callback } = await props.searchParams;
  const redirectTo = callback ?? pathsConfig.app.home;

  return (
    <AuthCard>
      <UpdatePasswordForm redirectTo={redirectTo} />
    </AuthCard>
  );
}

export default UpdatePasswordPage;
