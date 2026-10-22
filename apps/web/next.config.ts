import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import createNextIntlPlugin from 'next-intl/plugin';

import billing from './config/billing.json';
import { checkEnv } from './config/env-check';
import { securityHeaders } from './config/security-headers';

// Create the next-intl plugin with the request config path
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true';

const INTERNAL_PACKAGES = [
  '@kit/ui',
  '@kit/auth',
  '@kit/accounts',
  '@kit/shared',
  '@kit/supabase',
  '@kit/i18n',
  '@kit/next',
];

type RemotePattern = NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
>[number];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          supabaseUrl: SUPABASE_URL,
          sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          analyticsSrc: getAnalyticsSrc(),
          captcha: Boolean(process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY),
          isDev: !IS_PRODUCTION,
          reportOnly: process.env.CSP_REPORT_ONLY === 'true',
        }),
      },
    ];
  },
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  images: {
    remotePatterns: getRemotePatterns(),
    /**
     * Supabase Storage runs on 127.0.0.1 locally, and Next.js 16 blocks
     * optimizing local IPs by default. Only relax this outside production.
     */
    dangerouslyAllowLocalIP: !IS_PRODUCTION,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: [],
  // needed for supporting dynamic imports for local content
  outputFileTracingIncludes: {
    '/*': ['./content/**/*'],
  },
  /**
   * Partial Prerendering. Every route ships a static shell that serves
   * immediately, and anything behind a Suspense boundary streams in per
   * request. The kit ships zero `export const instant = false` opt-outs.
   */
  cacheComponents: true,
  /** Builds one App Shell per route and reuses it for every link to it. */
  partialPrefetching: true,
  reactCompiler: ENABLE_REACT_COMPILER,
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  experimental: {
    mdxRs: true,
    /** TypeScript 7 does not expose the compiler API Next.js uses, so drive it
     * through the TS CLI instead. */
    useTypeScriptCli: true,
    optimizePackageImports: [
      'lucide-react',
      '@base-ui/react',
      'date-fns',
      ...INTERNAL_PACKAGES,
    ],
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  /** We already do typechecking as a separate task in CI. Next.js 16 removed
   * the `eslint` option along with `next lint`; linting runs via the ESLint CLI. */
  typescript: { ignoreBuildErrors: true },
};

export default function nextConfig(phase: string) {
  // `build:test` (NODE_ENV=test) runs with local demo keys and is exempt
  if (phase === PHASE_PRODUCTION_BUILD && process.env.NODE_ENV !== 'test') {
    assertProductionEnv();
  }

  return withNextIntl(config);
}

function assertProductionEnv() {
  const { errors, warnings } = checkEnv(
    process.env,
    Object.keys(billing.products),
  );

  for (const warning of warnings) console.warn(`⚠ env: ${warning}`);

  if (errors.length > 0) {
    throw new Error(
      `Production env incomplete, see .env.example:\n- ${errors.join('\n- ')}`,
    );
  }
}

function getAnalyticsSrc() {
  switch (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER) {
    case 'plausible':
      return (
        process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ||
        'https://plausible.io/js/script.js'
      );
    case 'umami':
      return (
        process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'
      );
    default:
      return undefined;
  }
}

function getRemotePatterns(): RemotePattern[] {
  const remotePatterns: RemotePattern[] = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: 'https',
      hostname,
    });
  }

  return IS_PRODUCTION
    ? remotePatterns
    : [
        {
          protocol: 'http',
          hostname: '127.0.0.1',
        },
        {
          protocol: 'http',
          hostname: 'localhost',
        },
      ];
}
