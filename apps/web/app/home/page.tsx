import Link from 'next/link';

import { buttonVariants } from '@kit/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { PageBody, PageHeader } from '@kit/ui/page';

import appConfig from '~/config/app.config';
import pathsConfig from '~/config/paths.config';

export const metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <>
      <PageHeader title={'Home'} description={`Welcome to ${appConfig.name}`} />

      <PageBody>
        <Card className={'w-full lg:max-w-2xl'}>
          <CardHeader>
            <CardTitle>You are all set</CardTitle>
            <CardDescription>
              Manage your plan and invoices in Billing, or update your profile
              in Settings.
            </CardDescription>
          </CardHeader>

          <CardFooter className={'gap-2'}>
            <Link href={pathsConfig.app.billing} className={buttonVariants()}>
              Billing
            </Link>
            <Link
              href={pathsConfig.app.profileSettings}
              className={buttonVariants({ variant: 'outline' })}
            >
              Settings
            </Link>
          </CardFooter>
        </Card>
      </PageBody>
    </>
  );
}
