import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import siteConfig from '~/config/site.config';

import { HeroMock } from './hero-mock';

function Title({ title, highlight }: { title: string; highlight?: string }) {
  const i = highlight ? title.indexOf(highlight) : -1;

  if (!highlight || i < 0) return <>{title}</>;

  return (
    <>
      {title.slice(0, i)}
      <span className={'text-accent-brand'}>{highlight}</span>
      {title.slice(i + highlight.length)}
    </>
  );
}

/** Server component, no animation: the H1 is the LCP element and paints on first render. */
export function Hero() {
  const { announcement, title, highlight, subtitle, cta } = siteConfig.hero;

  const pill = (
    <span
      className={
        'text-muted-foreground bg-card inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm'
      }
    >
      <span className={'bg-accent-brand size-1.5 rounded-full'} aria-hidden />
      {announcement?.label}
      {announcement?.href && <ArrowRight className={'size-3.5'} aria-hidden />}
    </span>
  );

  return (
    <section className={'relative overflow-hidden px-4 pt-16 pb-12 md:pt-24'}>
      <div
        aria-hidden
        className={
          'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] [background:radial-gradient(ellipse_50%_60%_at_50%_0%,oklch(0.7_0.12_190/0.12),transparent)]'
        }
      />

      <div
        className={
          'container mx-auto flex flex-col items-center gap-6 text-center'
        }
      >
        {announcement &&
          (announcement.href ? (
            <Link href={announcement.href} className={'rounded-full'}>
              {pill}
            </Link>
          ) : (
            pill
          ))}

        <h1
          className={
            'max-w-4xl text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[4rem]'
          }
        >
          <Title title={title} highlight={highlight} />
        </h1>

        <p className={'text-muted-foreground max-w-2xl text-lg text-balance'}>
          {subtitle}
        </p>

        <div className={'flex flex-col gap-3 sm:flex-row'}>
          <Link
            href={cta.href}
            prefetch={cta.href.startsWith('/auth') ? false : undefined}
            className={cn(buttonVariants(), 'h-12 px-6 text-base')}
          >
            {cta.label}
            <ArrowRight aria-hidden />
          </Link>
          <Link
            href={'/pricing'}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-12 px-6 text-base',
            )}
          >
            See pricing
          </Link>
        </div>
      </div>

      <HeroMock />
    </section>
  );
}
