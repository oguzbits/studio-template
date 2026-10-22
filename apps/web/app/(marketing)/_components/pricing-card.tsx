import Link from 'next/link';

import { Check } from 'lucide-react';

import { Button, buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { AuthGate } from '~/components/auth-gate';
import pathsConfig from '~/config/paths.config';
import type { ProductKey } from '~/config/studio.config';
import studioConfig from '~/config/studio.config';
import { createCheckout } from '~/lib/billing/checkout-actions';

type Product = (typeof studioConfig.products)[ProductKey];

export function PricingCard(props: {
  productKey: ProductKey;
  highlighted: boolean;
  product: Product;
}) {
  const { productKey: key, highlighted, product } = props;
  const price =
    product.mode === 'subscription'
      ? product.priceMonthlyEur
      : product.priceEur;
  const variant = highlighted ? 'default' : 'outline';

  return (
    <div
      className={cn(
        'bg-card flex flex-col gap-5 rounded-xl border p-6',
        highlighted && 'border-accent-brand',
      )}
    >
      <div className={'flex items-center justify-between'}>
        <h2 className={'text-xl font-medium'}>{product.name}</h2>
        {highlighted && (
          <span
            className={
              'bg-accent-brand text-accent-brand-foreground rounded-full px-2.5 py-0.5 text-xs font-medium'
            }
          >
            Popular
          </span>
        )}
      </div>

      <p className={'text-4xl font-semibold tracking-tight'}>
        {price} EUR
        <span className={'text-muted-foreground text-base font-normal'}>
          {product.mode === 'subscription' ? ' / month' : ' one-time'}
        </span>
      </p>

      {product.features && product.features.length > 0 && (
        <ul className={'flex flex-col gap-2 text-sm'}>
          {product.features.map((f) => (
            <li key={f} className={'flex items-start gap-2'}>
              <Check
                className={'text-accent-brand mt-0.5 size-4 shrink-0'}
                aria-hidden
              />
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className={'mt-auto'}>
        <AuthGate
          signedIn={
            <form action={createCheckout.bind(null, key)}>
              <Button
                type={'submit'}
                variant={variant}
                className={'h-10 w-full'}
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
              className={cn(buttonVariants({ variant }), 'h-10 w-full')}
            >
              Sign up to subscribe
            </Link>
          }
        />
      </div>
    </div>
  );
}
