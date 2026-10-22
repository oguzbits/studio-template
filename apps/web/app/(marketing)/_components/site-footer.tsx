import { cacheLife } from 'next/cache';
import Link from 'next/link';

import { Trans } from '@kit/ui/trans';

import { AppLogo } from '~/components/app-logo';
import appConfig from '~/config/app.config';
import siteConfig from '~/config/site.config';

/**
 * The copyright year is an unstable value, and `<Suspense>` does not fix those,
 * only uncached data. It is the same for every visitor and changes once a year,
 * so caching it is the right tool. `await connection()` would also silence the
 * error, but it would make the footer render per request and take every
 * marketing page's static shell down with it.
 */
async function getCopyrightYear() {
  'use cache';

  cacheLife('days');

  return new Date().getFullYear();
}

const columns = [
  {
    heading: 'Product',
    links: [
      { href: '/pricing', label: 'Pricing' },
      ...(siteConfig.faq.length > 0 ? [{ href: '/faq', label: 'FAQ' }] : []),
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { href: '/impressum', label: 'Impressum' },
      { href: '/datenschutz', label: 'Datenschutz' },
      { href: '/kuendigen', label: 'Verträge hier kündigen' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/auth/sign-in', label: 'Sign in', prefetch: false },
      { href: '/auth/sign-up', label: 'Sign up', prefetch: false },
    ],
  },
];

export async function SiteFooter() {
  const year = await getCopyrightYear();

  return (
    <footer className={'mt-auto border-t py-12'}>
      <div
        className={
          'container mx-auto flex flex-col gap-10 md:flex-row md:justify-between'
        }
      >
        <div className={'flex max-w-xs flex-col gap-3'}>
          <AppLogo className="w-[85px] md:w-[95px]" />
          <p className={'text-muted-foreground text-sm'}>
            {siteConfig.tagline}
          </p>
        </div>

        <nav
          aria-label={'Footer'}
          className={'grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-16'}
        >
          {columns.map((col) => (
            <div key={col.heading} className={'flex flex-col gap-3'}>
              <h2 className={'text-sm font-medium'}>{col.heading}</h2>
              <ul className={'flex flex-col gap-2'}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={'prefetch' in link ? link.prefetch : undefined}
                      className={
                        'text-muted-foreground hover:text-foreground text-sm'
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <p className={'text-muted-foreground container mx-auto mt-10 text-xs'}>
        <Trans
          i18nKey="marketing.copyright"
          values={{ product: appConfig.name, year }}
        />
      </p>
    </footer>
  );
}
