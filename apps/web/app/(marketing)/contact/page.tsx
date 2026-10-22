import { pageMetadata } from '~/lib/page-metadata';

import { SitePageHeader } from '../_components/site-page-header';
import { ContactForm } from './contact-form';

export const metadata = pageMetadata({ path: '/contact', title: 'Contact' });

function ContactPage() {
  return (
    <>
      <SitePageHeader
        title={'Contact'}
        subtitle={
          'Questions or feedback? Write to us and we will answer by email.'
        }
      />

      <div className={'container pb-24 md:pb-40'}>
        <div className={'max-w-[480px]'}>
          <ContactForm />
        </div>
      </div>
    </>
  );
}

export default ContactPage;
