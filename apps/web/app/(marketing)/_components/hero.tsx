import Link from 'next/link';

import { buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import siteConfig from '~/config/site.config';

/** Server component, no animation: the H1 is the LCP element and paints on first render. */
export function Hero() {
  const { title, subtitle, cta } = siteConfig.hero;

  return (
    <section className={'container pt-16 pb-24 md:pt-28 md:pb-40'}>
      <h1
        className={
          'font-display text-[clamp(2.75rem,0.5rem+9.6vw,10rem)] leading-[0.96] font-normal tracking-[-0.035em] text-balance'
        }
      >
        {title}
      </h1>

      <div className={'mt-8 flex flex-col gap-10 md:mt-12'}>
        <p
          className={
            'max-w-[34ch] text-xl leading-snug text-pretty md:text-2xl'
          }
        >
          {subtitle}
        </p>

        <div className={'flex flex-wrap items-center gap-x-8 gap-y-4'}>
          <Link
            href={cta.href}
            prefetch={cta.href.startsWith('/auth') ? false : undefined}
            className={cn(buttonVariants(), 'h-12 px-6 text-base')}
          >
            {cta.label}
          </Link>

          <Link href={'/pricing'} className={'quiet-link text-base'}>
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
