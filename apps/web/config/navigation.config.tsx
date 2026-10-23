import { CreditCard, Gem, Home, Settings } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

// One flat list (empty group label = no heading). Add a labelled group with
// `children` only when a feature brings sub-pages.
const routes = [
  {
    label: '',
    children: [
      {
        label: 'common.routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        // exact match: do not stay highlighted on nested routes like /home/settings
        highlightMatch: `^${pathsConfig.app.home}$`,
      },
      {
        // example paid page (requireEntitlement('pro')); rename or drop per product
        label: 'Pro',
        path: pathsConfig.app.pro,
        Icon: <Gem className={iconClasses} />,
      },
      {
        label: 'common.routes.billing',
        path: pathsConfig.app.billing,
        Icon: <CreditCard className={iconClasses} />,
      },
      {
        label: 'common.routes.settings',
        path: pathsConfig.app.profileSettings,
        Icon: <Settings className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
