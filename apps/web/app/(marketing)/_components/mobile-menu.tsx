'use client';

import { useRef } from 'react';

import Link from 'next/link';

import { Menu } from 'lucide-react';

/** Native <details> menu: keyboard and screen reader support come for free, no Base UI. */
export function MobileMenu(props: {
  links: { label: string; path: string }[];
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute('open');

  return (
    <details
      ref={ref}
      className={'group relative md:hidden'}
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      <summary
        aria-label={'Menu'}
        className={
          'hover:bg-muted flex size-10 cursor-pointer list-none items-center justify-center rounded-lg [&::-webkit-details-marker]:hidden'
        }
      >
        <Menu className={'size-5'} aria-hidden />
      </summary>

      <nav
        aria-label={'Mobile'}
        className={
          'bg-popover absolute top-12 right-0 flex w-56 flex-col rounded-xl border p-1 shadow-lg'
        }
      >
        {props.links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            onClick={close}
            className={
              'hover:bg-muted flex h-11 items-center rounded-lg px-3 text-sm font-medium'
            }
          >
            {link.label}
          </Link>
        ))}

        <Link
          href={'/auth/sign-in'}
          prefetch={false}
          onClick={close}
          className={
            'hover:bg-muted flex h-11 items-center rounded-lg px-3 text-sm font-medium'
          }
        >
          Sign in
        </Link>
      </nav>
    </details>
  );
}
