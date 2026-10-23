import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import appConfig from '~/config/app.config';

/** The product name set in the display serif: the logo until a product has its own. */
export function Wordmark({
  className,
  prefetch,
  href = '/',
}: {
  className?: string;
  prefetch?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn('font-display text-2xl tracking-[-0.01em]', className)}
    >
      {appConfig.name}
    </Link>
  );
}
