import appConfig from '~/config/app.config';
import siteConfig from '~/config/site.config';
import studioConfig, { type ProductKey } from '~/config/studio.config';
import { highlightedProduct } from '~/lib/billing/highlighted-product';
import { pageMetadata } from '~/lib/page-metadata';
import { cn } from '@kit/ui/utils';

import { FaqList } from '../_components/faq-list';
import { PricingCard } from '../_components/pricing-card';
import { SitePageHeader } from '../_components/site-page-header';

export const metadata = pageMetadata({ path: '/pricing', title: 'Pricing' });

function PricingPage() {
  const products = Object.entries(studioConfig.products) as [
    ProductKey,
    (typeof studioConfig.products)[ProductKey],
  ][];
  const highlighted = highlightedProduct(studioConfig.products);
  // one plan sits beside the title; several get their own row of columns
  const single = products.length === 1;

  return (
    <div>
      <div className={'container grid gap-x-16 pb-24 md:pb-40 lg:grid-cols-12'}>
        <SitePageHeader
          container={false}
          className={single ? 'lg:col-span-5' : 'lg:col-span-12'}
          title={'Pricing'}
          subtitle={`Choose your ${appConfig.name} plan`}
        />

        <div
          className={cn(
            'grid gap-16 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',
            single ? 'lg:col-span-6 lg:col-start-7 lg:mt-16' : 'lg:col-span-12',
          )}
        >
          {products.map(([key, product]) => (
            <PricingCard
              key={key}
              productKey={key}
              product={product}
              highlighted={key === highlighted}
              popular={!single && key === highlighted}
            />
          ))}
        </div>
      </div>

      {siteConfig.faq.length > 0 && (
        <section className={'container pb-24 md:pb-40'}>
          <h2 className={'section-heading mb-12 md:mb-16'}>Questions</h2>
          <FaqList items={siteConfig.faq} />
        </section>
      )}
    </div>
  );
}

export default PricingPage;
