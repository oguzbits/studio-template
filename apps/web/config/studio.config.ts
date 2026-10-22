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

const AiSchema = z.object({
  provider: z.enum(['anthropic', 'openai-compatible']),
  defaultModel: z.string().min(1),
  prices: z.record(
    z.string(),
    z.object({ inEurPerMTok: z.number(), outEurPerMTok: z.number() }),
  ),
});

const StudioConfigSchema = z.object({
  products: z.record(z.string(), ProductSchema),
  ai: AiSchema,
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

// Source: claude-api skill model table (Anthropic list prices, USD/MTok, prompts <=100K for Haiku 5.5), 2026-10-22;
// OpenAI price is from memory, unverified. FX assumption 1 USD = 0.92 EUR, update when prices or rate change.
const ai = {
  provider: process.env.AI_PROVIDER ?? 'anthropic',
  defaultModel: process.env.AI_MODEL || 'claude-haiku-5-5',
  prices: {
    'claude-haiku-5-5': { inEurPerMTok: 0.092, outEurPerMTok: 0.46 },
    'claude-sonnet-5-5': { inEurPerMTok: 1.84, outEurPerMTok: 9.2 },
    'claude-opus-5-5': { inEurPerMTok: 3.68, outEurPerMTok: 18.4 },
    'gpt-4o-mini': { inEurPerMTok: 0.138, outEurPerMTok: 0.552 },
  },
};

export type ProductKey = keyof typeof products;

type StudioConfig = {
  products: Record<ProductKey, z.infer<typeof ProductSchema>>;
  legal: typeof legal;
  ai: z.infer<typeof AiSchema>;
};

const studioConfig = {
  ...StudioConfigSchema.parse({ products, ai }),
  legal,
} as StudioConfig;

export default studioConfig;
