import { Suspense } from 'react';

import { PageBody, PageHeader } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';

import { requireEntitlement } from '~/lib/billing/require-entitlement';

export const metadata = {
  title: 'Pro',
};

export default function ProPage() {
  return (
    <>
      <PageHeader
        title={'Pro'}
        description={
          'Example page behind the paywall. Replace it with your feature.'
        }
      />

      <PageBody>
        <Suspense fallback={<Skeleton className={'h-36 w-full rounded-md'} />}>
          <ProContent />
        </Suspense>
      </PageBody>
    </>
  );
}

async function ProContent() {
  const entitlement = await requireEntitlement('pro');

  const periodEnd = entitlement.current_period_end
    ? new Date(entitlement.current_period_end).toLocaleDateString('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <dl data-test={'pro-content'} className={'border-border border-t text-sm'}>
      <Row label={'Access'}>You have Pro ({entitlement.status}).</Row>
      <Row label={'Period ends'}>{periodEnd}</Row>
      <Row label={'Guarded by'}>
        <code className={'bg-muted rounded px-1.5 py-0.5 text-xs'}>
          requireEntitlement(&apos;pro&apos;)
        </code>
      </Row>
    </dl>
  );
}

function Row({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div
      className={
        'border-border grid gap-1 border-b py-3.5 sm:grid-cols-[12rem_1fr] sm:gap-4'
      }
    >
      <dt className={'text-muted-foreground'}>{label}</dt>
      <dd className={'tabular-nums'}>{children}</dd>
    </div>
  );
}
