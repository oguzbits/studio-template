import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import { Monogram } from '~/components/monogram';

function LogoImage({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-x-2', className)}>
      <span className={'ring-border size-7 rounded-md ring-1'}>
        <Monogram px={28} />
      </span>

      <span className={'text-base font-semibold tracking-tight'}>
        {process.env.NEXT_PUBLIC_PRODUCT_NAME}
      </span>
    </span>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link
      aria-label={label ?? process.env.NEXT_PUBLIC_PRODUCT_NAME ?? 'Home'}
      href={href ?? '/'}
    >
      <LogoImage className={className} />
    </Link>
  );
}
