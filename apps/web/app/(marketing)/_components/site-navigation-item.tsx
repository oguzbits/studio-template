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
        'flex h-10 items-center text-base underline-offset-[0.3em] hover:underline',
        active ? 'text-foreground underline' : 'text-muted-foreground',
      )}
    >
      {children}
    </Link>
  );
}
