import Link from 'next/link';

import { Button } from '@kit/ui/button';
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
      <PageHeader description={`Welcome to ${appConfig.name}`} />

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
            <Button
              nativeButton={false}
              render={<Link href={pathsConfig.app.billing} />}
            >
              Billing
            </Button>
            <Button
              variant={'outline'}
              nativeButton={false}
              render={<Link href={pathsConfig.app.profileSettings} />}
            >
              Settings
            </Button>
          </CardFooter>
        </Card>
      </PageBody>
    </>
  );
}
