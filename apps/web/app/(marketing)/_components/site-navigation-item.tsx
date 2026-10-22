'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn, isRouteActive } from '@kit/ui/utils';

export function SiteNavigationItem({
  path,
  children,
}: React.PropsWithChildren<{ path: string }>) {
  const active = isRouteActive(path, usePathname());

  return (
    <Link
      href={path}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'hover:bg-muted flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
