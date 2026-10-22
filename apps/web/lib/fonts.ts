import { Geist as SansFont } from 'next/font/google';

/**
 * @sans
 * @description Define here the sans font.
 * By default, it uses the Geist font from Google Fonts.
 */
const sans = SansFont({
  subsets: ['latin'],
  variable: '--font-sans',
  fallback: ['system-ui', 'Helvetica Neue', 'Helvetica', 'Arial'],
  preload: true,
  display: 'swap',
  // no `weight`: Geist is a variable font, one file covers every weight
});

/**
 * @heading
 * @description Define here the heading font.
 */
const heading = sans;

// we export these fonts into the root layout
export { sans, heading };
