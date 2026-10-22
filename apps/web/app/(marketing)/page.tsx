import Link from 'next/link';

import { ArrowRightIcon, LayoutDashboard } from 'lucide-react';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
} from '@kit/ui/marketing';

import appConfig from '~/config/app.config';
import siteConfig from '~/config/site.config';
import { pageMetadata } from '~/lib/page-metadata';

import { WaitlistForm } from './_components/waitlist-form';

export const metadata = pageMetadata({ path: '/' });

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        {/* no fade-in: the hero title is the LCP element and must paint at first render */}
        <Hero
          animate={false}
          title={<span>{siteConfig.hero.title}</span>}
          subtitle={<span>{siteConfig.hero.subtitle}</span>}
          cta={
            <CtaButton className="h-10 text-sm">
              <Link href={siteConfig.hero.cta.href}>
                <span className={'flex items-center space-x-0.5'}>
                  <span>{siteConfig.hero.cta.label}</span>
                  <ArrowRightIcon className={'h-4'} />
                </span>
              </Link>
            </CtaButton>
          }
        />
      </div>

      <div className={'container mx-auto'}>
        <FeatureShowcase
          heading={
            <b className="font-medium tracking-tight">Why {appConfig.name}</b>
          }
          icon={
            <FeatureShowcaseIconContainer>
              <LayoutDashboard className="h-4 w-4" />
              <span>Features</span>
            </FeatureShowcaseIconContainer>
          }
        >
          <FeatureGrid>
            {siteConfig.features.map((feature) => (
              <FeatureCard
                key={feature.title}
                className={'relative col-span-1 overflow-hidden'}
                label={feature.title}
                description={feature.description}
              />
            ))}
          </FeatureGrid>
        </FeatureShowcase>
      </div>

      <div className={'container mx-auto flex flex-col items-center gap-4'}>
        <h2 className={'text-2xl font-medium'}>Get notified at launch</h2>
        <WaitlistForm />
      </div>
    </div>
  );
}

export default Home;
