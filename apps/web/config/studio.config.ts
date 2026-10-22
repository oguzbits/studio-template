import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';

import { resolveLegal } from './legal';

const ProductSchema = z.object({
  name: z.string().min(1),
  mode: z.enum(['subscription', 'payment']),
  // empty until the STRIPE_PRICE_* variable is set; checkout then fails with a clear error
  priceId: z.string(),
  priceMonthlyEur: z.number().positive().optional(),
});

const StudioConfigSchema = z.object({
  products: z.record(z.string(), ProductSchema),
});

const { legal, missing } = resolveLegal(process.env);

if (missing.length > 0) {
  void getLogger().then((logger) =>
    logger.warn({ missing }, 'Legal details missing, pages show placeholders'),
  );
}

const products = {
  pro: {
    name: 'Pro',
    mode: 'subscription',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    priceMonthlyEur: 9,
  },
} satisfies Record<string, z.input<typeof ProductSchema>>;

export type ProductKey = keyof typeof products;

type StudioConfig = {
  products: Record<ProductKey, z.infer<typeof ProductSchema>>;
  legal: typeof legal;
};

const studioConfig = {
  ...StudioConfigSchema.parse({ products }),
  legal,
} as StudioConfig;

export default studioConfig;
