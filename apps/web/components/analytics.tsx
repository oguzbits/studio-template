import Script from 'next/script';

import { getLogger } from '@kit/shared/logger';

/**
 * Cookieless analytics only (Plausible or Umami), so no consent banner is needed.
 * Configured through NEXT_PUBLIC_ANALYTICS_PROVIDER; unset means off.
 */
export async function Analytics() {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  if (provider === 'plausible') {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

    if (!domain) {
      return warnMissing('NEXT_PUBLIC_PLAUSIBLE_DOMAIN');
    }

    return (
      <Script
        defer
        data-domain={domain}
        src={
          process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ||
          'https://plausible.io/js/script.js'
        }
      />
    );
  }

  if (provider === 'umami') {
    const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    if (!id) {
      return warnMissing('NEXT_PUBLIC_UMAMI_WEBSITE_ID');
    }

    return (
      <Script
        defer
        data-website-id={id}
        src={
          process.env.NEXT_PUBLIC_UMAMI_SRC ||
          'https://cloud.umami.is/script.js'
        }
      />
    );
  }

  return null;
}

async function warnMissing(variable: string) {
  (await getLogger()).warn(
    { variable },
    'Analytics disabled, variable missing',
  );

  return null;
}
