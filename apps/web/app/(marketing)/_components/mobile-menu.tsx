'use client';

import { useRef } from 'react';

import Link from 'next/link';

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
        className={
          'flex h-10 cursor-pointer list-none items-center text-base [&::-webkit-details-marker]:hidden'
        }
      >
        Menu
      </summary>

      <nav
        aria-label={'Mobile'}
        className={
          'bg-popover absolute top-12 right-0 z-10 flex w-56 flex-col rounded-lg p-2 group-open:shadow-lg' // taste-skill-ignore: an open menu floats
        }
      >
        {props.links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            onClick={close}
            className={
              'hover:bg-muted flex h-11 items-center rounded-md px-3 text-base'
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
            'hover:bg-muted flex h-11 items-center rounded-md px-3 text-base'
          }
        >
          Sign in
        </Link>
      </nav>
    </details>
  );
}
