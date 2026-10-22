import { z } from 'zod';

import type { SiteConfig } from './site.config';

// Test-only: keeps zod out of the client bundle.
export const SiteSchema: z.ZodType<SiteConfig> = z.object({
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
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string() })),
});
