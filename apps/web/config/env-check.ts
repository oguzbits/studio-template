/**
 * Production env check, run by `next build` (see next.config.ts). A failed Vercel
 * build keeps the previous deployment live; a crash at startup would not.
 * Messages name variables only, never values.
 */
type Env = Record<string, string | undefined>;

const LEGAL_REQUIRED = [
  'LEGAL_NAME',
  'LEGAL_STREET',
  'LEGAL_ZIP_CITY',
  'LEGAL_EMAIL',
  'LEGAL_PHONE',
  'LEGAL_RESPONSIBLE',
];

export function checkEnv(env: Env, productKeys: string[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const require = (
    key: string,
    valid: (v: string) => boolean,
    hint: string,
  ) => {
    const value = env[key];

    if (!value) {
      errors.push(`${key} is missing (${hint})`);
    } else if (!valid(value)) {
      errors.push(`${key} is invalid (${hint})`);
    }
  };
  const any = () => true;

  require('NEXT_PUBLIC_SITE_URL', (v) =>
    v.startsWith('https://') &&
    !v.includes('localhost'), 'public https URL of the deployment');
  require('NEXT_PUBLIC_SUPABASE_URL', (v) =>
    v.startsWith('https://'), 'https URL of the Supabase project');
  require('NEXT_PUBLIC_SUPABASE_ANON_KEY', any, 'Supabase anon key');
  require('SUPABASE_SERVICE_ROLE_KEY', any, 'Supabase service role key');
  require('CRON_SECRET', (v) => v.length >= 32, 'at least 32 characters');
  require('RESEND_API_KEY', (v) => v.startsWith('re_'), 'Resend key re_…');
  require('EMAIL_FROM', any, 'sender address on a Resend-verified domain');

  if (env.STRIPE_SECRET_KEY) {
    require('STRIPE_SECRET_KEY', (v) =>
      /^(sk|rk)_(test|live)_/.test(v), 'secret or restricted key sk_…/rk_…');
    require('STRIPE_WEBHOOK_SECRET', (v) =>
      v.startsWith('whsec_'), 'webhook signing secret whsec_…');
    for (const key of productKeys) {
      require(`STRIPE_PRICE_${key.toUpperCase()}`, (v) =>
        v.startsWith('price_'), `Stripe price ID price_… for product "${key}"`);
    }
  } else {
    warnings.push('STRIPE_SECRET_KEY is not set: checkout and portal are off');
  }

  const analytics = env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  if (analytics === 'plausible') {
    require('NEXT_PUBLIC_PLAUSIBLE_DOMAIN', any, 'domain registered at Plausible');
  } else if (analytics === 'umami') {
    require('NEXT_PUBLIC_UMAMI_WEBSITE_ID', any, 'Umami website ID');
  }

  const aiKey =
    (env.AI_PROVIDER ?? 'anthropic') === 'anthropic'
      ? 'ANTHROPIC_API_KEY'
      : 'OPENAI_API_KEY';
  if (!env[aiKey] && !env.AI_BASE_URL) {
    warnings.push(`${aiKey} is not set: AI calls will fail`);
  }

  const legalMissing = LEGAL_REQUIRED.filter((key) => !env[key]);
  if (legalMissing.length > 0) {
    warnings.push(
      `${legalMissing.join(', ')} not set: legal pages show placeholders`,
    );
  }

  if (!env.ADMIN_EMAILS) {
    warnings.push('ADMIN_EMAILS is not set: /admin is closed for everyone');
  }

  return { errors, warnings };
}
