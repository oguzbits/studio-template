import { pageMetadata } from '~/lib/page-metadata';
import siteConfig from '~/config/site.config';

import { CtaBand } from './_components/cta-band';
import { FaqList } from './_components/faq-list';
import { FeatureList } from './_components/feature-list';
import { Hero } from './_components/hero';

export const metadata = pageMetadata({ path: '/' });

function Home() {
  return (
    <>
      <Hero />
      <FeatureList />

      {siteConfig.faq.length > 0 && (
        <section className={'container pb-24 md:pb-40'}>
          <h2 className={'section-heading mb-12 md:mb-16'}>Questions</h2>
          <FaqList items={siteConfig.faq} />
        </section>
      )}

      <CtaBand />
    </>
  );
}

export default Home;
