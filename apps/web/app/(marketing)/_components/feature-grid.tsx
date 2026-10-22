import {
  Clock,
  CreditCard,
  Globe,
  Lock,
  Mail,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import siteConfig, { type FeatureIcon } from '~/config/site.config';

const icons: Record<FeatureIcon, LucideIcon> = {
  shield: ShieldCheck,
  'credit-card': CreditCard,
  globe: Globe,
  zap: Zap,
  lock: Lock,
  mail: Mail,
  sparkles: Sparkles,
  clock: Clock,
};

export function FeatureGrid() {
  return (
    <section className={'container mx-auto'}>
      <ul className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
        {siteConfig.features.map((f) => {
          const Icon = f.icon ? icons[f.icon] : null;

          return (
            <li
              key={f.title}
              className={'bg-card flex flex-col gap-3 rounded-xl border p-6'}
            >
              {Icon && (
                <span
                  className={
                    'bg-accent-brand/10 text-accent-brand flex size-9 items-center justify-center rounded-lg'
                  }
                >
                  <Icon className={'size-5'} aria-hidden />
                </span>
              )}
              <h2 className={'font-medium'}>{f.title}</h2>
              <p className={'text-muted-foreground text-sm'}>{f.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
