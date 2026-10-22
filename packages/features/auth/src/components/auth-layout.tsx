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
    <div className={cn('flex min-h-svh flex-col', className)}>
      {Logo ? (
        <header className={'flex h-20 items-center justify-center px-4'}>
          <Logo />
        </header>
      ) : null}

      <main
        className={cn(
          'flex w-full max-w-[480px] flex-1 flex-col justify-center gap-y-6 self-center px-4 pt-6 pb-16',
          contentClassName,
        )}
      >
        {children}

        <AuthLegalNote privacyPath={'/datenschutz'} />
      </main>
    </div>
  );
}

/** Short centred title with one quiet sentence: the only thing above the form. */
export function AuthHeading(props: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className={'flex flex-col items-center gap-y-3 text-center'}>
      <h1
        className={
          'font-display text-[clamp(2.75rem,1rem+3.5vw,4.25rem)] leading-[1.02] font-normal tracking-[-0.03em] text-balance'
        }
      >
        {props.title}
      </h1>

      {props.subtitle ? (
        <p className={'text-muted-foreground text-lg text-balance'}>
          {props.subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** The one calm surface that holds the whole form. */
export function AuthCard(props: React.PropsWithChildren) {
  return (
    <div
      className={
        'bg-muted flex flex-col gap-y-5 rounded-[28px] p-6 sm:p-8 [&_input]:bg-background'
      }
    >
      {props.children}
    </div>
  );
}
