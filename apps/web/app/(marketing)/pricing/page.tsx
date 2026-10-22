import appConfig from '~/config/app.config';
import siteConfig from '~/config/site.config';
import studioConfig, { type ProductKey } from '~/config/studio.config';
import { highlightedProduct } from '~/lib/billing/highlighted-product';
import { pageMetadata } from '~/lib/page-metadata';

import { FaqList } from '../_components/faq-list';
import { PricingCard } from '../_components/pricing-card';
import { SitePageHeader } from '../_components/site-page-header';

export const metadata = pageMetadata({ path: '/pricing', title: 'Pricing' });

const maxWidth = ['max-w-md', 'max-w-3xl', 'max-w-5xl'];

function PricingPage() {
  const products = Object.entries(studioConfig.products) as [
    ProductKey,
    (typeof studioConfig.products)[ProductKey],
  ][];
  const highlighted = highlightedProduct(studioConfig.products);

  return (
    <div>
      <SitePageHeader
        title={'Pricing'}
        subtitle={`Choose your ${appConfig.name} plan`}
      />

      <div
        className={`mx-auto grid w-full gap-6 px-4 py-12 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] ${maxWidth[Math.min(products.length, 3) - 1]}`}
      >
        {products.map(([key, product]) => (
          <PricingCard
            key={key}
            productKey={key}
            product={product}
            highlighted={key === highlighted}
          />
        ))}
      </div>

      {siteConfig.faq.length > 0 && (
        <section className={'container mx-auto pb-20'}>
          <h2 className={'mb-8 text-center text-2xl font-semibold'}>
            Frequently asked questions
          </h2>
          <FaqList items={siteConfig.faq} />
        </section>
      )}
    </div>
  );
}

export default PricingPage;
