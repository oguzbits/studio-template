import siteConfig from '~/config/site.config';

import { SiteNavigationItem } from './site-navigation-item';

export const navLinks = [
  { label: 'Pricing', path: '/pricing' },
  ...(siteConfig.faq.length > 0 ? [{ label: 'FAQ', path: '/faq' }] : []),
];

export function SiteNavigation() {
  return (
    <nav aria-label={'Main'} className={'hidden items-center gap-1 md:flex'}>
      {navLinks.map((item) => (
        <SiteNavigationItem key={item.path} path={item.path}>
          {item.label}
        </SiteNavigationItem>
      ))}
    </nav>
  );
}
