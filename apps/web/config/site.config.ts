// Public marketing copy. Pure data: imported by client components, so no zod here.
// The schema lives in site.schema.ts and is checked by site.config.test.ts.
export type SiteConfig = {
  tagline: string;
  description: string;
  hero: {
    title: string;
    subtitle: string;
    cta: { label: string; href: string };
  };
  features: { title: string; description: string }[];
  // empty = /faq returns 404 and is left out of sitemap and navigation
  faq: { question: string; answer: string }[];
};

// The hero and tagline are fill-ins that read as such: replace them per product.
// Features and FAQ are true for every product built on this template.
const siteConfig = {
  tagline: 'Your product, in a few words',
  description:
    'Sign up in seconds, pay securely with Stripe and cancel anytime. Hosted in the EU.',
  hero: {
    // two lines at most at every width: keep it near 30 characters
    title: 'Your product, in one sentence.',
    subtitle:
      'Say here what it does and who it is for. Accounts, payments with Stripe and hosting in the EU already work.',
    cta: { label: 'Create an account', href: '/auth/sign-up' },
  },
  features: [
    {
      title: 'Hosted in the EU',
      description:
        'Your data is stored in Frankfurt and protected by row-level security.',
    },
    {
      title: 'Secure payments',
      description: 'Checkout runs on Stripe. We never see your card details.',
    },
    {
      title: 'Cancel anytime',
      description:
        'Manage or cancel your subscription yourself in the customer portal.',
    },
  ],
  faq: [
    {
      question: 'How do I cancel my subscription?',
      answer:
        'Open Billing in your account and choose "Manage subscription", or use the cancellation page linked in the footer. Your plan stays active until the end of the current billing period.',
    },
    {
      question: 'Where can I find my invoices?',
      answer:
        'In the customer portal: open Billing in your account and choose "Manage subscription".',
    },
    {
      question: 'Which payment methods do you accept?',
      answer:
        'Every method Stripe Checkout offers in your country, such as credit and debit cards.',
    },
    {
      question: 'Where is my data stored?',
      answer:
        'In the EU (Frankfurt). The privacy policy lists every service we use.',
    },
  ],
} satisfies SiteConfig;

export default siteConfig;
