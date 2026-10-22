import { z } from 'zod';

import type { FeatureIcon, SiteConfig } from './site.config';

const icons = [
  'shield',
  'credit-card',
  'globe',
  'zap',
  'lock',
  'mail',
  'sparkles',
  'clock',
] as const satisfies readonly FeatureIcon[];

// Test-only: keeps zod out of the client bundle.
export const SiteSchema: z.ZodType<SiteConfig> = z.object({
  tagline: z.string().min(1),
  description: z.string().min(1),
  hero: z
    .object({
      title: z.string().min(1),
      subtitle: z.string().min(1),
      cta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
      announcement: z
        .object({ label: z.string().min(1), href: z.string().optional() })
        .optional(),
      highlight: z.string().min(1).optional(),
    })
    .refine((h) => !h.highlight || h.title.includes(h.highlight), {
      message: 'hero.highlight must be part of hero.title',
      path: ['highlight'],
    }),
  features: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        icon: z.enum(icons).optional(),
      }),
    )
    .max(6),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string() })),
});
