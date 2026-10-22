'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser, isInternalPath } from '@kit/shared/utils';

import { AuthMethods } from './auth-methods';
import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { PasswordSignInContainer } from './password-sign-in-container';

export function SignInMethodsContainer(props: {
  paths: {
    callback: string;
    home: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    oAuth: Provider[];
  };
}) {
  const router = useRouter();
  const next = useSearchParams().get('next');
  // `next` comes from the URL: never navigate off-site
  const nextPath = isInternalPath(next) ? next : props.paths.home;

  const redirectUrl = isBrowser()
    ? new URL(props.paths.callback, window?.location.origin).toString()
    : '';

  const onSignIn = () => {
    router.replace(nextPath);
  };

  return (
    <AuthMethods
      password={
        props.providers.password ? (
          <PasswordSignInContainer onSignIn={onSignIn} />
        ) : null
      }
      magicLink={
        props.providers.magicLink ? (
          <MagicLinkAuthContainer
            redirectUrl={redirectUrl}
            shouldCreateUser={false}
          />
        ) : null
      }
      oauth={
        props.providers.oAuth.length ? (
          <OauthProviders
            enabledProviders={props.providers.oAuth}
            shouldCreateUser={false}
            paths={{
              callback: props.paths.callback,
              returnPath: props.paths.home,
            }}
          />
        ) : null
      }
    />
  );
}
