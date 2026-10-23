import { Suspense } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from '@kit/ui/sidebar';
import { SidebarNavigation } from '@kit/ui/sidebar-navigation';
import { Skeleton } from '@kit/ui/skeleton';

import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { Wordmark } from '~/components/wordmark';
import { navigationConfig } from '~/config/navigation.config';
import pathsConfig from '~/config/paths.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

/**
 * The wordmark and the navigation do not depend on the user, so they prerender.
 * Only the account block in the footer needs the session, so only that sits
 * behind a boundary. Taking the user as a prop here would push the await up
 * into the layout and make the whole sidebar, and everything under it, wait.
 */
export function HomeSidebar() {
  return (
    <Sidebar collapsible={'icon'}>
      <SidebarHeader
        className={
          'h-14 flex-row items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2'
        }
      >
        <Wordmark
          href={pathsConfig.app.home}
          className={'truncate text-xl group-data-[collapsible=icon]:hidden'}
        />

        <SidebarTrigger
          className={'text-muted-foreground hover:text-foreground'}
        />
      </SidebarHeader>

      <SidebarContent className={'pt-2'}>
        <SidebarNavigation config={navigationConfig} />
      </SidebarContent>

      <SidebarFooter
        className={
          'border-sidebar-border border-t p-3 group-data-[collapsible=icon]:p-2'
        }
      >
        <Suspense fallback={<AccountBlockFallback />}>
          <AccountBlock />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

async function AccountBlock() {
  const user = await requireUserInServerComponent();

  return <ProfileAccountDropdownContainer user={user} />;
}

function AccountBlockFallback() {
  return (
    <div className={'flex items-center gap-x-3 p-2'}>
      <Skeleton className={'size-8 shrink-0 rounded-full'} />
      <Skeleton className={'h-4 w-full'} />
    </div>
  );
}
