import { cn } from '@kit/ui/utils';

export function SitePageHeader({
  title,
  subtitle,
  container = true,
  className = '',
  children,
}: React.PropsWithChildren<{
  title: string;
  subtitle: string;
  container?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 pt-16 pb-12 md:pt-28 md:pb-20',
        container && 'container',
        className,
      )}
    >
      <h1 className={'page-title'}>{title}</h1>
      <p className={'max-w-[40ch] text-xl leading-snug md:text-2xl'}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}
