import { Suspense, cache } from 'react';

import Link from 'next/link';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';
import { cn } from '@kit/ui/utils';

import { TableSkeleton } from '~/components/skeletons/page-skeletons';
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
      <PageHeader title={'Billing'} description={'Your plans and payments.'}>
        <Suspense fallback={null}>
          <ManageBillingAction />
        </Suspense>
      </PageHeader>

      <PageBody>
        <Suspense fallback={<TableSkeleton rows={2} />}>
          <BillingOverview />
        </Suspense>
      </PageBody>
    </>
  );
}

async function ManageBillingAction() {
  const { hasCustomer } = await loadBilling();

  if (!hasCustomer) {
    return null;
  }

  return (
    <form action={openPortal}>
      <Button type={'submit'} data-test={'manage-billing'}>
        Manage billing
      </Button>
    </form>
  );
}

async function BillingOverview() {
  const { entitlements, now } = await loadBilling();
  const productKeys = Object.keys(studioConfig.products) as ProductKey[];

  return (
    <>
      <table className={'w-full text-sm'}>
        <thead>
          <tr
            className={
              'text-muted-foreground border-border border-b text-left text-xs'
            }
          >
            <th className={'py-2.5 pr-4 font-normal sm:w-[30%]'}>Plan</th>
            <th
              className={
                'hidden py-2.5 pr-4 font-normal sm:table-cell sm:w-[20%]'
              }
            >
              Price
            </th>
            <th className={'py-2.5 pr-4 font-normal sm:w-[20%]'}>Status</th>
            <th
              className={
                'hidden py-2.5 pr-4 font-normal sm:table-cell sm:w-[20%]'
              }
            >
              Period ends
            </th>
            <th className={'py-2.5'}>
              <span className={'sr-only'}>Action</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {productKeys.map((key) => {
            const product = studioConfig.products[key];
            const entitlement =
              entitlements.find((e) => e.product_key === key) ?? null;
            const decision = accessDecision(entitlement, now);
            const price = formatPrice(product);
            const periodEnd = entitlement?.current_period_end
              ? new Date(entitlement.current_period_end).toLocaleDateString(
                  'en',
                  { year: 'numeric', month: 'short', day: 'numeric' },
                )
              : null;

            return (
              <tr key={key} className={'border-border border-b'}>
                <td className={'py-3.5 pr-4 align-middle'}>
                  <div className={'font-medium'}>{product.name}</div>
                  <div className={'text-muted-foreground text-xs sm:hidden'}>
                    {[price, periodEnd && `until ${periodEnd}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </td>

                <td
                  className={
                    'text-muted-foreground hidden py-3.5 pr-4 tabular-nums sm:table-cell'
                  }
                >
                  {price}
                </td>

                <td className={'py-3.5 pr-4'}>
                  <StatusMark
                    status={entitlement?.status ?? null}
                    decision={decision}
                  />
                </td>

                <td
                  className={
                    'text-muted-foreground hidden py-3.5 pr-4 tabular-nums sm:table-cell'
                  }
                >
                  {periodEnd ?? '—'}
                </td>

                <td className={'py-2.5 text-right'}>
                  {decision === 'billing' ? (
                    <form action={openPortal}>
                      <Button
                        type={'submit'}
                        size={'sm'}
                        variant={'outline'}
                        data-test={`fix-billing-${key}`}
                      >
                        Manage billing
                      </Button>
                    </form>
                  ) : null}

                  {decision === 'pricing' ? (
                    <form action={createCheckout.bind(null, key)}>
                      <Button
                        type={'submit'}
                        size={'sm'}
                        variant={'outline'}
                        data-test={`checkout-${key}`}
                      >
                        Get {product.name}
                      </Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {entitlements.length === 0 ? (
        <p
          data-test={'billing-empty'}
          className={'text-muted-foreground py-4 text-sm'}
        >
          No active plan yet. Compare what each plan includes on the{' '}
          <Link
            href={'/pricing'}
            className={'text-foreground underline underline-offset-4'}
          >
            pricing page
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}

function formatPrice(product: {
  mode: 'subscription' | 'payment';
  priceMonthlyEur?: number;
  priceEur?: number;
}) {
  if (product.mode === 'subscription' && product.priceMonthlyEur) {
    return `${product.priceMonthlyEur} € / month`;
  }

  return product.priceEur ? `${product.priceEur} € one-time` : '—';
}

// One quiet mark per row: a dot plus the status in words; red only when payment needs fixing.
function StatusMark({
  status,
  decision,
}: {
  status: string | null;
  decision: ReturnType<typeof accessDecision>;
}) {
  if (!status) {
    return <span className={'text-muted-foreground'}>—</span>;
  }

  const label =
    status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

  return (
    <span className={'inline-flex items-center gap-2 whitespace-nowrap'}>
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', {
          'bg-primary': decision === 'allow',
          'bg-destructive': decision === 'billing',
          'bg-muted-foreground': decision === 'pricing',
        })}
      />
      <span className={cn({ 'text-destructive': decision === 'billing' })}>
        {label}
      </span>
    </span>
  );
}

// cached per request: the header action and the table share one read
const loadBilling = cache(async () => {
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
});
