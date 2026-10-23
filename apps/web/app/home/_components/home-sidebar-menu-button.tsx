'use client';

import { Menu } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { useSidebar } from '@kit/ui/sidebar';

/** Opens the sidebar as a sheet on small screens (same nav and account block). */
export function HomeSidebarMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant={'ghost'}
      size={'icon'}
      aria-label={'Open menu'}
      data-test={'mobile-menu-trigger'}
      onClick={toggleSidebar}
    >
      <Menu className={'size-5'} />
    </Button>
  );
}
