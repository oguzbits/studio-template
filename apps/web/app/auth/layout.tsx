import { AuthLayoutShell } from '@kit/auth/shared';

import { AppLogo } from '~/components/app-logo';
import { AuthProvider } from '~/components/auth-provider';

function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthLayoutShell Logo={AppLogo}>{children}</AuthLayoutShell>
    </AuthProvider>
  );
}

export default AuthLayout;
