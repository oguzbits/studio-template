'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { buttonVariants } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { useSessionCookie } from '~/components/use-session-cookie';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const ThemeToggle = dynamic(
  () => import('./theme-toggle').then((mod) => ({ default: mod.ThemeToggle })),
  { ssr: false, loading: () => <span className={'size-10'} /> },
);

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

const SiteHeaderUserMenu = dynamic(
  () =>
    import('./site-header-user-menu').then((mod) => ({
      default: mod.SiteHeaderUserMenu,
    })),
  {
    ssr: false,
    loading: () => <AuthButtons />,
  },
);

/**
 * The session is read on the client, never on the server. Reading it in the
 * marketing layout put user data into the server HTML, which is why those pages
 * had to be kept out of shared caches. The server response is now identical for
 * every visitor, so marketing pages are safe on any CDN.
 *
 * Without a session cookie the user menu and the Supabase client are not loaded
 * at all. A signed-in visitor briefly sees the signed-out actions until the
 * session resolves.
 */
export function SiteHeaderAccountSection() {
  if (!useSessionCookie()) {
    return <AuthButtons />;
  }

  return <SiteHeaderUserMenu fallback={<AuthButtons />} />;
}

function AuthButtons() {
  return (
    <div className={'flex items-center gap-1'}>
      <If condition={features.enableThemeToggle}>
        <ThemeToggle />
      </If>

      <Link
        href={pathsConfig.auth.signIn}
        prefetch={false}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'hidden h-10 px-4 md:inline-flex',
        )}
      >
        <Trans i18nKey={'auth.signIn'} />
      </Link>

      <Link
        href={pathsConfig.auth.signUp}
        prefetch={false}
        className={cn(buttonVariants(), 'h-10 px-4')}
      >
        <Trans i18nKey={'auth.signUp'} />
      </Link>
    </div>
  );
}
