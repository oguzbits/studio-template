// Plain object: imported by client components, so no zod here.
import type { Provider } from '@supabase/supabase-js';

type AuthConfig = {
  captchaTokenSiteKey?: string;
  displayTermsCheckbox?: boolean;
  providers: { password: boolean; magicLink: boolean; oAuth: Provider[] };
};

const authConfig: AuthConfig = {
  // NB: This is a public key, so it's safe to expose.
  // Copy the value from the Supabase Dashboard.
  captchaTokenSiteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,

  // whether to display the terms checkbox during sign-up
  displayTermsCheckbox:
    process.env.NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX === 'true',

  // NB: Enable the providers below in the Supabase Console
  // in your production project
  providers: {
    password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === 'true',
    magicLink: process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK === 'true',
    oAuth: process.env.NEXT_PUBLIC_AUTH_GOOGLE === 'true' ? ['google'] : [],
  },
};

export default authConfig;
