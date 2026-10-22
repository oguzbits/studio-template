'use client';

import dynamic from 'next/dynamic';

import type { AbstractIntlMessages } from 'next-intl';
import { ThemeProvider } from 'next-themes';

import { CaptchaProvider } from '@kit/auth/captcha/client';
import { I18nClientProvider } from '@kit/i18n/provider';
import { If } from '@kit/ui/if';

import appConfig from '~/config/app.config';
import authConfig from '~/config/auth.config';
import featuresFlagConfig from '~/config/feature-flags.config';

import { ReactQueryProvider } from './react-query-provider';

const captchaSiteKey = authConfig.captchaTokenSiteKey;

// dynamic: its AlertDialog pulls Base UI popup code into every page's first load
const VersionUpdater = dynamic(() =>
  import('@kit/ui/version-updater').then((mod) => ({
    default: mod.VersionUpdater,
  })),
);

const CaptchaTokenSetter = dynamic(async () => {
  if (!captchaSiteKey) {
    return Promise.resolve(() => null);
  }

  const { CaptchaTokenSetter } = await import('@kit/auth/captcha/client');

  return {
    default: CaptchaTokenSetter,
  };
});

export function RootProviders({
  locale,
  messages,
  theme = appConfig.theme,
  children,
}: React.PropsWithChildren<{
  // The locale to use for the app
  locale: string;
  // The i18n messages
  messages: AbstractIntlMessages;
  theme?: string;
}>) {
  return (
    <ReactQueryProvider>
      <I18nClientProvider locale={locale} messages={messages}>
        <CaptchaProvider>
          <CaptchaTokenSetter siteKey={captchaSiteKey} />

          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
            defaultTheme={theme}
            enableColorScheme={false}
          >
            {children}
          </ThemeProvider>
        </CaptchaProvider>

        <If condition={featuresFlagConfig.enableVersionUpdater}>
          <VersionUpdater />
        </If>
      </I18nClientProvider>
    </ReactQueryProvider>
  );
}
