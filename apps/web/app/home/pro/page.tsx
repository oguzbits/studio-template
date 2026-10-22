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
      <PageHeader description={'Demo page behind the paywall'} />

      <PageBody>
        <Suspense fallback={<Skeleton className={'h-20 w-full rounded-lg'} />}>
          <ProContent />
        </Suspense>
      </PageBody>
    </>
  );
}

async function ProContent() {
  const entitlement = await requireEntitlement('pro');

  return <p data-test={'pro-content'}>You have Pro ({entitlement.status}).</p>;
}
