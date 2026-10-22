import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { FaqList } from '~/(marketing)/_components/faq-list';
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import siteConfig from '~/config/site.config';
import { jsonLd } from '~/lib/json-ld';
import { pageMetadata } from '~/lib/page-metadata';

export const generateMetadata = async () => {
  const t = await getTranslations();

  return pageMetadata({ path: '/faq', title: t('marketing.faq') });
};

async function FAQPage() {
  const t = await getTranslations();
  const faqItems = siteConfig.faq;

  if (faqItems.length === 0) {
    notFound();
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => {
      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      };
    }),
  };

  return (
    <>
      <script
        key={'ld:json'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={t('marketing.faq')}
          subtitle={t('marketing.faqSubtitle')}
        />

        <div className={'container flex flex-col space-y-8 pb-16'}>
          <FaqList items={faqItems} />
        </div>
      </div>
    </>
  );
}

export default FAQPage;
