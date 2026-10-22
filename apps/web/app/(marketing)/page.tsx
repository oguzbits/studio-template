import { pageMetadata } from '~/lib/page-metadata';
import siteConfig from '~/config/site.config';

import { CtaBand } from './_components/cta-band';
import { FaqList } from './_components/faq-list';
import { FeatureGrid } from './_components/feature-grid';
import { Hero } from './_components/hero';

export const metadata = pageMetadata({ path: '/' });

function Home() {
  return (
    <div className={'flex flex-col gap-24 pb-24'}>
      <Hero />
      <FeatureGrid />

      {siteConfig.faq.length > 0 && (
        <section className={'container mx-auto'}>
          <h2 className={'mb-8 text-center text-3xl font-semibold'}>
            Frequently asked questions
          </h2>
          <FaqList items={siteConfig.faq} />
        </section>
      )}

      <CtaBand />
    </div>
  );
}

export default Home;
