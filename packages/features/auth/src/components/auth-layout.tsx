import { cn } from '@kit/ui/utils';

import { AuthLegalNote } from './auth-legal-note';

// No entry animation: the form is the LCP element on /auth/*.
export function AuthLayoutShell({
  children,
  className,
  Logo,
  contentClassName,
}: React.PropsWithChildren<{
  Logo?: React.ComponentType;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-y-8 px-4 py-10',
        className,
      )}
    >
      {Logo ? <Logo /> : null}

      <div
        className={cn(
          'bg-background flex w-full max-w-[400px] flex-col gap-y-4',
          contentClassName,
        )}
      >
        {children}

        <AuthLegalNote privacyPath={'/datenschutz'} />
      </div>
    </div>
  );
}
