import siteConfig from './site.config';

type Theme = 'light' | 'dark' | 'system';

// Plain object (no zod, it is imported by client components). Env rules live in env-check.ts.
const appConfig = {
  name: process.env.NEXT_PUBLIC_PRODUCT_NAME ?? '',
  // copy lives in site.config.ts, not in env
  title: `${process.env.NEXT_PUBLIC_PRODUCT_NAME} – ${siteConfig.tagline}`,
  description: siteConfig.description,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? '',
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  theme: (process.env.NEXT_PUBLIC_DEFAULT_THEME_MODE || 'system') as Theme,
  production: process.env.NODE_ENV === 'production',
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR ?? '',
  themeColorDark: process.env.NEXT_PUBLIC_THEME_COLOR_DARK ?? '',
};

export default appConfig;
