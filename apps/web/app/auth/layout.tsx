import { AuthLayoutShell } from '@kit/auth/shared';

import { AppLogo } from '~/components/app-logo';
import { AuthProvider } from '~/components/auth-provider';

// no prefetch: the home page would add its chunks to every auth page load
const Logo = () => <AppLogo prefetch={false} />;

function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthLayoutShell Logo={Logo}>{children}</AuthLayoutShell>
    </AuthProvider>
  );
}

export default AuthLayout;
