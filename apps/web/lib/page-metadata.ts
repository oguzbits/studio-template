import type { Metadata } from 'next';

import appConfig from '~/config/app.config';

/**
 * Per-page metadata with canonical and og:url. A page's `openGraph` replaces the
 * root one instead of merging, so the site defaults are repeated here.
 * Relative paths resolve against `metadataBase` from the root layout.
 */
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title?: string;
  description?: string;
}): Metadata {
  return {
    // an explicit `undefined` would wipe the inherited root value
    ...(title && { title }),
    ...(description && { description }),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      siteName: appConfig.name,
      title: title ?? appConfig.title,
      description: description ?? appConfig.description,
    },
  };
}
