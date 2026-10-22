import { notFound } from 'next/navigation';

import { ChevronDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

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
          <div className="flex w-full max-w-xl flex-col">
            {faqItems.map((item, index) => {
              return <FaqItem key={index} item={item} />;
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default FAQPage;

function FaqItem({
  item,
}: React.PropsWithChildren<{
  item: {
    question: string;
    answer: string;
  };
}>) {
  return (
    <details className={'group border-b px-2 py-4 last:border-b-transparent'}>
      <summary
        className={
          'flex items-center justify-between hover:cursor-pointer hover:underline'
        }
      >
        <h2
          className={
            'hover:underline-none cursor-pointer font-sans font-medium'
          }
        >
          {item.question}
        </h2>

        <div>
          <ChevronDown
            className={'h-5 transition duration-300 group-open:-rotate-180'}
          />
        </div>
      </summary>

      <div className={'text-muted-foreground flex flex-col space-y-2 py-1'}>
        {item.answer}
      </div>
    </details>
  );
}
