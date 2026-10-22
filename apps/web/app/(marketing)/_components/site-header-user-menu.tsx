'use client';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';

import { AuthProvider } from '~/components/auth-provider';
import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

/**
 * Loaded only when a session cookie exists, so anonymous visitors never download
 * the Supabase client. The auth listener lives here too: signing out from this
 * menu reloads the page into the signed-out header.
 */
export function SiteHeaderUserMenu(props: { fallback: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserMenu fallback={props.fallback} />
    </AuthProvider>
  );
}

function UserMenu(props: { fallback: React.ReactNode }) {
  const signOut = useSignOut();
  const { data: user } = useUser();

  if (!user) {
    return props.fallback;
  }

  return (
    <PersonalAccountDropdown
      showProfileName={false}
      paths={paths}
      features={features}
      user={user}
      signOutRequested={() => signOut.mutateAsync()}
    />
  );
}
