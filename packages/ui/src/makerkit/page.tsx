import * as React from 'react';

import { cn } from '../lib/utils';
import { If } from './if';
import { PageStyleProvider } from './page-style-context';

export type PageLayoutStyle = 'sidebar' | 'header' | 'custom';

type PageProps = React.PropsWithChildren<{
  style?: PageLayoutStyle;
  contentContainerClassName?: string;
  className?: string;
  sticky?: boolean;
}>;

export function Page(props: PageProps) {
  return (
    <PageStyleProvider style={props.style ?? 'sidebar'}>
      {renderPage(props)}
    </PageStyleProvider>
  );
}

function renderPage(props: PageProps) {
  switch (props.style) {
    case 'header':
      return <PageWithHeader {...props} />;

    case 'custom':
      return props.children;

    default:
      return <PageWithSidebar {...props} />;
  }
}

function PageWithSidebar(props: PageProps) {
  const { Navigation, Children, MobileNavigation } = getSlotsFromPage(props);

  return (
    <div
      className={cn('flex min-w-0 flex-1 overflow-x-hidden', props.className)}
    >
      {Navigation}

      <div
        className={
          props.contentContainerClassName ??
          'mx-auto flex h-screen w-full min-w-0 flex-1 flex-col bg-inherit'
        }
      >
        {MobileNavigation}

        <div
          className={'bg-background flex min-w-0 flex-1 flex-col px-4 md:px-8'}
        >
          {Children}
        </div>
      </div>
    </div>
  );
}

export function PageMobileNavigation(
  props: React.PropsWithChildren<{
    className?: string;
  }>,
) {
  return (
    <div
      className={cn(
        'container flex w-full items-center justify-between px-0 py-2 group-data-[slot="sidebar-wrapper"]/sidebar-wrapper:border-b group-data-[slot="sidebar-wrapper"]/sidebar-wrapper:px-4 lg:hidden',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function PageWithHeader(props: PageProps) {
  const { Navigation, Children, MobileNavigation } = getSlotsFromPage(props);

  return (
    <div
      className={cn(
        'bg-background flex min-h-screen flex-1 flex-col',
        props.className,
      )}
    >
      <div
        className={props.contentContainerClassName ?? 'flex flex-1 flex-col'}
      >
        <div
          className={cn(
            'bg-background/95 supports-[backdrop-filter]:bg-background/80 border-b',
            {
              'sticky top-0 z-10 backdrop-blur-md': props.sticky ?? true,
            },
          )}
        >
          <div className="container mx-auto flex h-14 w-full items-center">
            <div
              className={
                'hidden w-full min-w-0 flex-1 items-center space-x-4 lg:flex lg:px-4'
              }
            >
              {Navigation}
            </div>

            {MobileNavigation}
          </div>
        </div>

        <div className="container mx-auto flex w-full flex-1 flex-col">
          {Children}
        </div>
      </div>
    </div>
  );
}

export function PageBody(
  props: React.PropsWithChildren<{
    className?: string;
  }>,
) {
  const className = cn('flex min-w-0 flex-1 flex-col pb-16', props.className);

  return <main className={className}>{props.children}</main>;
}

export function PageNavigation(props: React.PropsWithChildren) {
  return (
    <div
      className={
        'flex flex-1 flex-col bg-inherit group-data-[slot="sidebar-wrapper"]/sidebar-wrapper:flex-initial'
      }
    >
      {props.children}
    </div>
  );
}

export function PageDescription(props: React.PropsWithChildren) {
  return (
    <div className={'text-muted-foreground max-w-prose text-sm'}>
      {props.children}
    </div>
  );
}

export function PageTitle(props: React.PropsWithChildren) {
  return (
    <h1
      className={
        'font-heading text-2xl leading-tight font-medium tracking-[-0.015em]'
      }
    >
      {props.children}
    </h1>
  );
}

export function PageHeaderActions(props: React.PropsWithChildren) {
  return <div className={'flex items-center gap-2'}>{props.children}</div>;
}

/**
 * Title (24 px sans) with one grey sentence under it; actions sit top right.
 * The sidebar toggle lives in the sidebar header, so headers carry no chrome.
 */
export function PageHeader({
  children,
  title,
  description,
  className,
}: React.PropsWithChildren<{
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-start sm:justify-between lg:pt-8',
        className,
      )}
    >
      <div className={'flex min-w-0 flex-col gap-y-1.5'}>
        <If condition={title}>
          <PageTitle>{title}</PageTitle>
        </If>

        <If condition={description}>
          <PageDescription>{description}</PageDescription>
        </If>
      </div>

      <If condition={children}>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      </If>
    </div>
  );
}

function getSlotsFromPage(props: React.PropsWithChildren) {
  return React.Children.toArray(props.children).reduce<{
    Children: React.ReactElement | null;
    Navigation: React.ReactElement | null;
    MobileNavigation: React.ReactElement | null;
  }>(
    (acc, child) => {
      if (!React.isValidElement(child)) {
        return acc;
      }

      if (child.type === PageNavigation) {
        return {
          ...acc,
          Navigation: child,
        };
      }

      if (child.type === PageMobileNavigation) {
        return {
          ...acc,
          MobileNavigation: child,
        };
      }

      return {
        ...acc,
        Children: child,
      };
    },
    {
      Children: null,
      Navigation: null,
      MobileNavigation: null,
    },
  );
}
