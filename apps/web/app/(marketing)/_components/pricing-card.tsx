import Link from 'next/link';

import { Button, buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { AuthGate } from '~/components/auth-gate';
import pathsConfig from '~/config/paths.config';
import type { ProductKey } from '~/config/studio.config';
import studioConfig from '~/config/studio.config';
import { createCheckout } from '~/lib/billing/checkout-actions';

type Product = (typeof studioConfig.products)[ProductKey];

/** One plan as a plain column: no card chrome, the price carries it. */
export function PricingCard(props: {
  productKey: ProductKey;
  highlighted: boolean;
  // plain-text label, only when there is more than one plan to choose from
  popular: boolean;
  // lg and up: the page shows the features elsewhere
  featuresBeside?: boolean;
  product: Product;
}) {
  const {
    productKey: key,
    highlighted,
    popular,
    product,
    featuresBeside,
  } = props;
  const price =
    product.mode === 'subscription'
      ? product.priceMonthlyEur
      : product.priceEur;
  const variant = highlighted ? 'default' : 'outline';

  return (
    <div className={cn('flex flex-col', highlighted && 'bg-muted p-8 md:p-12')}>
      <div className={'flex items-baseline justify-between gap-4'}>
        <h2 className={'text-2xl font-medium tracking-tight'}>
          {product.name}
        </h2>
        {popular && <p className={'text-muted-foreground'}>Popular</p>}
      </div>

      <p className={'mt-6 flex items-baseline gap-3'}>
        <span
          className={
            'font-display text-[clamp(5rem,3rem+6vw,9rem)] leading-none tracking-[-0.035em] tabular-nums'
          }
        >
          €{price}
        </span>
        <span className={'text-muted-foreground text-lg'}>
          {product.mode === 'subscription' ? 'per month' : 'one-time'}
        </span>
      </p>

      {product.features && product.features.length > 0 && (
        <ul
          className={cn(
            'mt-10 flex flex-col gap-3 text-lg',
            featuresBeside && 'lg:hidden',
          )}
        >
          {product.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}

      <div className={'mt-auto pt-10'}>
        <AuthGate
          signedIn={
            <form action={createCheckout.bind(null, key)}>
              <Button
                type={'submit'}
                variant={variant}
                className={'h-12 w-full text-base'}
                data-test={`checkout-${key}`}
              >
                Subscribe
              </Button>
            </form>
          }
          signedOut={
            <Link
              href={`${pathsConfig.auth.signUp}?next=${encodeURIComponent('/pricing')}`}
              prefetch={false}
              className={cn(
                buttonVariants({ variant }),
                'h-12 w-full text-base',
              )}
            >
              Sign up to subscribe
            </Link>
          }
        />
      </div>
    </div>
  );
}
