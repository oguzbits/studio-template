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

import { WaitlistForm } from './_components/waitlist-form';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        <Hero
          title={<span>{appConfig.name}</span>}
          subtitle={<span>{appConfig.description}</span>}
          cta={
            <CtaButton className="h-10 text-sm">
              <Link href={'/pricing'}>
                <span className={'flex items-center space-x-0.5'}>
                  <span>See pricing</span>
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
            <FeatureCard
              className={'relative col-span-1 overflow-hidden'}
              label={'Feature one'}
              description={`Placeholder copy describing what ${appConfig.name} does.`}
            />
            <FeatureCard
              className={'relative col-span-1 overflow-hidden'}
              label={'Feature two'}
              description={`Placeholder copy describing what ${appConfig.name} does.`}
            />
            <FeatureCard
              className={'relative col-span-1 overflow-hidden'}
              label={'Feature three'}
              description={`Placeholder copy describing what ${appConfig.name} does.`}
            />
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
