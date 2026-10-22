import Link from 'next/link';

import { Button } from '@kit/ui/button';

import { AuthGate } from '~/components/auth-gate';
import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';
import studioConfig, { type ProductKey } from '~/config/studio.config';
import { createCheckout } from '~/lib/billing/checkout-actions';

import { pageMetadata } from '~/lib/page-metadata';

import { SitePageHeader } from '../_components/site-page-header';

export const metadata = pageMetadata({ path: '/pricing', title: 'Pricing' });

function PricingPage() {
  return (
    <div>
      <SitePageHeader
        title={'Pricing'}
        subtitle={`Choose your ${appConfig.name} plan`}
      />

      <div className={'container mx-auto grid gap-6 py-12 md:grid-cols-3'}>
        {Object.entries(studioConfig.products).map(([key, product]) => (
          <div
            key={key}
            className={'flex flex-col gap-4 rounded-lg border p-6'}
          >
            <h3 className={'text-xl font-medium'}>{product.name}</h3>

            <p className={'text-3xl font-semibold'}>
              {product.priceMonthlyEur ? `${product.priceMonthlyEur} EUR` : ''}
              <span className={'text-muted-foreground text-base font-normal'}>
                {product.mode === 'subscription' ? ' / month' : ' one-time'}
              </span>
            </p>

            <AuthGate
              signedIn={
                <form action={createCheckout.bind(null, key as ProductKey)}>
                  <Button
                    type={'submit'}
                    className={'w-full'}
                    data-test={`checkout-${key}`}
                  >
                    Subscribe
                  </Button>
                </form>
              }
              signedOut={
                <Button
                  nativeButton={false}
                  className={'w-full'}
                  render={
                    <Link
                      href={`${pathsConfig.auth.signUp}?next=${encodeURIComponent('/pricing')}`}
                    />
                  }
                >
                  Sign up to subscribe
                </Button>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricingPage;
