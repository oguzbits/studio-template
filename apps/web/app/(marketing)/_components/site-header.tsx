import { Wordmark } from '~/components/wordmark';

import { MobileMenu } from './mobile-menu';
import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation, navLinks } from './site-navigation';

// A plain bar on the page ground: not sticky, so it never sits on top of content.
export function SiteHeader() {
  return (
    <header>
      <div className={'container flex h-20 items-center gap-10'}>
        <Wordmark />

        <SiteNavigation />

        <div className={'ml-auto flex items-center gap-3'}>
          <SiteHeaderAccountSection />
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
