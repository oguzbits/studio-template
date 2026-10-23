'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import type { JwtPayload } from '@supabase/supabase-js';

import { ChevronsUpDown, Home, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { If } from '@kit/ui/if';
import { SubMenuModeToggle } from '@kit/ui/mode-toggle';
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { usePersonalAccountData } from '../hooks/use-personal-account-data';

export function PersonalAccountDropdown({
  className,
  user,
  signOutRequested,
  showProfileName = true,
  paths,
  features,
  account,
}: {
  user: JwtPayload;

  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };

  signOutRequested: () => unknown;

  paths: {
    home: string;
  };

  features: {
    enableThemeToggle: boolean;
  };

  showProfileName?: boolean;

  className?: string;
}) {
  const personalAccountData = usePersonalAccountData(user.id, account);

  const signedInAsLabel = useMemo(() => {
    const email = user?.email ?? undefined;
    const phone = user?.phone ?? undefined;

    return email ?? phone;
  }, [user]);

  const displayName =
    personalAccountData?.data?.name ?? account?.name ?? user?.email ?? '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open your profile menu"
        data-test={'account-dropdown-trigger'}
        className={cn(
          'focus-visible:ring-ring flex cursor-pointer items-center rounded-md outline-none focus-visible:ring-2',
          className ?? '',
          {
            ['hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent gap-x-3 p-2 text-left transition-colors group-data-[collapsible=icon]:p-0']:
              showProfileName,
          },
        )}
      >
        <ProfileAvatar
          className={'mx-0 shrink-0'}
          fallbackClassName={'bg-muted text-foreground text-sm'}
          displayName={displayName ?? user?.email ?? ''}
          pictureUrl={personalAccountData?.data?.picture_url}
        />

        <If condition={showProfileName}>
          <div
            className={
              'flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden'
            }
          >
            <span
              data-test={'account-dropdown-display-name'}
              className={'truncate text-sm leading-5 font-medium'}
            >
              {displayName}
            </span>

            <span
              data-test={'account-dropdown-email'}
              className={'text-muted-foreground truncate text-xs leading-4'}
            >
              {signedInAsLabel}
            </span>
          </div>

          <ChevronsUpDown
            className={
              'text-muted-foreground size-4 shrink-0 group-data-[collapsible=icon]:hidden'
            }
          />
        </If>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={showProfileName ? 'top' : 'bottom'}
        align={showProfileName ? 'start' : 'end'}
        sideOffset={8}
        className={'min-w-60'}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className={'flex flex-col gap-0.5 font-normal'}>
            <span className={'text-muted-foreground text-xs'}>
              <Trans i18nKey={'common.signedInAs'} />
            </span>

            <span className={'truncate text-sm'}>{signedInAsLabel}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link
              className={'flex w-full cursor-pointer items-center gap-x-2'}
              href={paths.home}
            />
          }
        >
          <Home className={'size-4'} />

          <span>
            <Trans i18nKey={'common.routes.home'} />
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <If condition={features.enableThemeToggle}>
          <SubMenuModeToggle />
        </If>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          data-test={'account-dropdown-sign-out'}
          role={'button'}
          className={'cursor-pointer'}
          onClick={signOutRequested}
        >
          <span className={'flex w-full items-center gap-x-2'}>
            <LogOut className={'size-4'} />

            <span>
              <Trans i18nKey={'auth.signOut'} />
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
