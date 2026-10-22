import { Newsreader as DisplayFont, Geist as SansFont } from 'next/font/google';

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

/**
 * @display
 * @description Serif for H1/H2 on marketing, auth and error pages (`font-display`).
 * Preloaded because the hero H1 is the LCP element. One static 400 cut instead
 * of the variable file: the serif is only ever set at 400, and the variable
 * file (58 KB) cost ~150-300 ms of simulated mobile LCP.
 */
const display = DisplayFont({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-face',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  preload: true,
  display: 'swap',
});

// we export these fonts into the root layout
export { sans, heading, display };
