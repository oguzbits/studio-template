import { PageBody } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';

import { PageHeaderSkeleton } from '~/components/skeletons/page-skeletons';

export default function HomeLoading() {
  return (
    <>
      <PageHeaderSkeleton />

      <PageBody>
        <Skeleton className={'h-40 w-full rounded-lg lg:max-w-2xl'} />
      </PageBody>
    </>
  );
}
