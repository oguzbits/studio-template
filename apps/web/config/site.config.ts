import { z } from 'zod';

// Public marketing copy. Pure data: imported by client components via app.config.
// Defaults are true for every product built on this template; replace them per product.
const SiteSchema = z.object({
  tagline: z.string().min(1),
  description: z.string().min(1),
  hero: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    cta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
  }),
  features: z
    .array(z.object({ title: z.string().min(1), description: z.string() }))
    .max(6),
  // empty = /faq returns 404 and is left out of sitemap and navigation
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string() })),
});

const siteConfig = SiteSchema.parse({
  tagline: 'The simple way to get it done',
  description:
    'Sign up in seconds, pay securely with Stripe and cancel anytime. Hosted in the EU.',
  hero: {
    title: 'The simple way to get it done',
    subtitle:
      'Sign up in seconds, pay securely with Stripe and cancel anytime. Hosted in the EU.',
    cta: { label: 'Get started', href: '/auth/sign-up' },
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
} satisfies z.input<typeof SiteSchema>);

export default siteConfig;
