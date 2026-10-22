import type { MetadataRoute } from 'next';

import appConfig from '~/config/app.config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.name,
    description: appConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: appConfig.themeColor,
    theme_color: appConfig.themeColor,
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
