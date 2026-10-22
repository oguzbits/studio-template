'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { useSessionCookie } from '~/components/use-session-cookie';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const ModeToggle = dynamic(
  () =>
    import('@kit/ui/mode-toggle').then((mod) => ({
      default: mod.ModeToggle,
    })),
  {
    ssr: false,
  },
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
    <div className={'flex space-x-2'}>
      <div className={'hidden space-x-0.5 md:flex'}>
        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>

        <Button
          nativeButton={false}
          render={<Link href={pathsConfig.auth.signIn} />}
          variant={'ghost'}
        >
          <Trans i18nKey={'auth.signIn'} />
        </Button>
      </div>

      <Button
        nativeButton={false}
        render={<Link href={pathsConfig.auth.signUp} />}
        className="group"
        variant={'default'}
      >
        <Trans i18nKey={'auth.signUp'} />
      </Button>
    </div>
  );
}
