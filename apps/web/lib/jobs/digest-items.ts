import 'server-only';

import appConfig from '~/config/app.config';

export type DigestItem = { title: string; url: string; summary?: string };

/** Example stub: each product replaces this with its own items for the user and day. */
export async function getDigestItems(
  _userId: string,
  _day: string,
): Promise<DigestItem[]> {
  return [
    {
      title: `Your ${appConfig.name} overview`,
      url: appConfig.url,
      summary: 'Replace getDigestItems with your product data.',
    },
  ];
}
