// Public marketing copy. Pure data: imported by client components, so no zod here.
// The schema lives in site.schema.ts and is checked by site.config.test.ts.
export type FeatureIcon =
  | 'shield'
  | 'credit-card'
  | 'globe'
  | 'zap'
  | 'lock'
  | 'mail'
  | 'sparkles'
  | 'clock';

export type SiteConfig = {
  tagline: string;
  description: string;
  hero: {
    title: string;
    subtitle: string;
    cta: { label: string; href: string };
    announcement?: { label: string; href?: string };
    // substring of title, rendered in the accent color
    highlight?: string;
  };
  features: { title: string; description: string; icon?: FeatureIcon }[];
  // empty = /faq returns 404 and is left out of sitemap and navigation
  faq: { question: string; answer: string }[];
};

// Defaults are true for every product built on this template; replace them per product.
const siteConfig = {
  tagline: 'The simple way to get it done',
  description:
    'Sign up in seconds, pay securely with Stripe and cancel anytime. Hosted in the EU.',
  hero: {
    title: 'The simple way to get it done',
    subtitle:
      'Sign up in seconds, pay securely with Stripe and cancel anytime. Hosted in the EU.',
    cta: { label: 'Get started', href: '/auth/sign-up' },
    announcement: { label: 'Hosted in the EU', href: '/pricing' },
    highlight: 'get it done',
  },
  features: [
    {
      title: 'Hosted in the EU',
      icon: 'globe',
      description:
        'Your data is stored in Frankfurt and protected by row-level security.',
    },
    {
      title: 'Secure payments',
      icon: 'credit-card',
      description: 'Checkout runs on Stripe. We never see your card details.',
    },
    {
      title: 'Cancel anytime',
      icon: 'clock',
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
