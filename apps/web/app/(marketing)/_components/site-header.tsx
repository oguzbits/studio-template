import { AppLogo } from '~/components/app-logo';

import { MobileMenu } from './mobile-menu';
import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation, navLinks } from './site-navigation';

export function SiteHeader() {
  return (
    <header
      className={'bg-background/80 sticky top-0 z-10 border-b backdrop-blur-lg'}
    >
      <div className={'container mx-auto flex h-16 items-center gap-6'}>
        <AppLogo />

        <SiteNavigation />

        <div className={'ml-auto flex items-center gap-1'}>
          <SiteHeaderAccountSection />
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
