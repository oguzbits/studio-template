'use client';

import { type ReactNode, useState } from 'react';

import { Trans } from '@kit/ui/trans';

/**
 * Layout only: OAuth on top, a plain "or", then one email method. With both
 * email methods enabled the other one is a quiet text switch under the form.
 * Pass null for a method that is not enabled.
 */
export function AuthMethods({
  password,
  magicLink,
  oauth,
}: {
  password: ReactNode | null;
  magicLink: ReactNode | null;
  oauth: ReactNode | null;
}) {
  const [method, setMethod] = useState<'password' | 'magic-link'>('password');
  const hasEmail = Boolean(password || magicLink);
  const both = Boolean(password && magicLink);

  return (
    <div className={'flex flex-col gap-y-5'}>
      {oauth}

      {oauth && hasEmail ? (
        <p
          role={'separator'}
          className={'text-muted-foreground text-center text-sm'}
        >
          <Trans i18nKey={'auth.or'} />
        </p>
      ) : null}

      {both
        ? method === 'password'
          ? password
          : magicLink
        : (password ?? magicLink)}

      {both ? (
        <button
          type={'button'}
          data-test={'auth-method-switch'}
          onClick={() =>
            setMethod(method === 'password' ? 'magic-link' : 'password')
          }
          className={
            'text-muted-foreground hover:text-foreground self-center text-sm underline underline-offset-4'
          }
        >
          <Trans
            i18nKey={
              method === 'password'
                ? 'auth.useMagicLinkInstead'
                : 'auth.usePasswordInstead'
            }
          />
        </button>
      ) : null}
    </div>
  );
}
