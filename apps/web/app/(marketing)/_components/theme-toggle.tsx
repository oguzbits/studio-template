'use client';

import { useSyncExternalStore } from 'react';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@kit/ui/button';

const ORDER = ['light', 'dark', 'system'] as const;
const noSubscription = () => () => {};

/** One button cycling light, dark, system. Not a dropdown, so no Base UI popup code. */
export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const current = mounted ? theme : 'system';
  const next = ORDER[(ORDER.indexOf(current as never) + 1) % ORDER.length]!;
  const Icon = current === 'light' ? Sun : current === 'dark' ? Moon : Monitor;

  return (
    <Button
      variant={'ghost'}
      size={'icon'}
      className={'size-10'}
      aria-label={`Theme: ${current}. Switch to ${next}`}
      onClick={() => {
        setTheme(next);
        document.cookie = `theme=${next}; path=/; max-age=31536000`;
      }}
    >
      <Icon className={'size-4'} aria-hidden />
    </Button>
  );
}
