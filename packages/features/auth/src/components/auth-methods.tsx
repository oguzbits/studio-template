'use client';

import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Trans } from '@kit/ui/trans';

/**
 * Layout only: OAuth on top, divider "or", then the email methods.
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
  const hasEmail = Boolean(password || magicLink);

  return (
    <div className={'flex flex-col gap-y-4'}>
      {oauth}

      {oauth && hasEmail ? (
        <div role={'separator'} className={'flex items-center gap-x-3'}>
          <span className={'bg-border h-px flex-1'} />

          <span className={'text-muted-foreground text-xs'}>
            <Trans i18nKey={'auth.or'} />
          </span>

          <span className={'bg-border h-px flex-1'} />
        </div>
      ) : null}

      {password && magicLink ? (
        <Tabs defaultValue={'password'}>
          <TabsList className={'w-full'}>
            <TabsTrigger value={'password'}>
              <Trans i18nKey={'auth.tabPassword'} />
            </TabsTrigger>

            <TabsTrigger value={'magic-link'}>
              <Trans i18nKey={'auth.tabMagicLink'} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={'password'}>{password}</TabsContent>
          <TabsContent value={'magic-link'}>{magicLink}</TabsContent>
        </Tabs>
      ) : (
        (password ?? magicLink)
      )}
    </div>
  );
}
