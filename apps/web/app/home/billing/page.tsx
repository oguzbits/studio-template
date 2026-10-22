import { Suspense } from 'react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import studioConfig, { type ProductKey } from '~/config/studio.config';
import { createCheckout, openPortal } from '~/lib/billing/checkout-actions';
import { accessDecision } from '~/lib/billing/status';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const metadata = {
  title: 'Billing',
};

export default function BillingPage() {
  return (
    <>
      <PageHeader description={'Your plans and payments'} />

      <PageBody>
        <div className={'flex w-full flex-1 flex-col gap-4 lg:max-w-2xl'}>
          <Suspense
            fallback={<Skeleton className={'h-40 w-full rounded-lg'} />}
          >
            <BillingOverview />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}

async function BillingOverview() {
  const { entitlements, hasCustomer, now } = await loadBilling();
  const productKeys = Object.keys(studioConfig.products) as ProductKey[];

  return (
    <>
      {productKeys.map((key) => {
        const product = studioConfig.products[key];
        const entitlement =
          entitlements.find((e) => e.product_key === key) ?? null;
        const hasAccess = accessDecision(entitlement, now) === 'allow';

        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>

              <CardDescription>
                {product.priceMonthlyEur
                  ? `${product.priceMonthlyEur} € / month`
                  : null}
                {entitlement?.current_period_end
                  ? ` · until ${new Date(entitlement.current_period_end).toLocaleDateString('en')}`
                  : null}
              </CardDescription>

              <CardAction>
                <Badge variant={hasAccess ? 'default' : 'outline'}>
                  {entitlement?.status ?? 'none'}
                </Badge>
              </CardAction>
            </CardHeader>

            {hasAccess ? null : (
              <CardContent>
                <form action={createCheckout.bind(null, key)}>
                  <Button type={'submit'} data-test={`checkout-${key}`}>
                    Get {product.name}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        );
      })}

      {hasCustomer ? (
        <form action={openPortal}>
          <Button
            type={'submit'}
            variant={'outline'}
            data-test={'manage-billing'}
          >
            Manage billing
          </Button>
        </form>
      ) : null}
    </>
  );
}

async function loadBilling() {
  const user = await requireUserInServerComponent();
  const client = getSupabaseServerClient();

  // RLS limits both reads to the current user
  const [entitlements, customer] = await Promise.all([
    client.from('entitlements').select('*').eq('user_id', user.id),
    client
      .from('billing_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (entitlements.error) {
    throw entitlements.error;
  }

  if (customer.error) {
    throw customer.error;
  }

  return {
    entitlements: entitlements.data,
    hasCustomer: customer.data !== null,
    now: new Date(),
  };
}
