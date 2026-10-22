import { cacheLife } from 'next/cache';
import Link from 'next/link';

import { Trans } from '@kit/ui/trans';

import { Wordmark } from '~/components/wordmark';
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
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Legal',
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
    <footer className={'container mt-auto pt-20 pb-12 md:pt-28'}>
      <div className={'grid gap-14 lg:grid-cols-12'}>
        <div className={'lg:col-span-5'}>
          <Wordmark className={'text-4xl md:text-5xl'} />
          <p className={'text-muted-foreground mt-4 max-w-[32ch] text-lg'}>
            {siteConfig.tagline}
          </p>
        </div>

        <nav
          aria-label={'Footer'}
          className={
            'grid grid-cols-2 gap-10 sm:flex sm:justify-between lg:col-span-6 lg:col-start-7'
          }
        >
          {columns.map((col) => (
            <div key={col.heading} className={'flex flex-col gap-4'}>
              <h2 className={'text-base font-medium'}>{col.heading}</h2>
              <ul className={'flex flex-col gap-3'}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={'prefetch' in link ? link.prefetch : undefined}
                      className={
                        'text-muted-foreground hover:text-foreground underline-offset-[0.3em] hover:underline'
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

      <p className={'text-muted-foreground mt-20 text-sm'}>
        <Trans
          i18nKey="marketing.copyright"
          values={{ product: appConfig.name, year }}
        />
      </p>
    </footer>
  );
}
