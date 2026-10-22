import { AuthLayoutShell } from '@kit/auth/shared';

import { AuthProvider } from '~/components/auth-provider';
import { Wordmark } from '~/components/wordmark';

// no prefetch: the home page would add its chunks to every auth page load
const Logo = () => <Wordmark prefetch={false} />;

function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthLayoutShell Logo={Logo}>{children}</AuthLayoutShell>
    </AuthProvider>
  );
}

export default AuthLayout;
