const REQUIRED = {
  name: 'LEGAL_NAME',
  street: 'LEGAL_STREET',
  zipCity: 'LEGAL_ZIP_CITY',
  email: 'LEGAL_EMAIL',
  phone: 'LEGAL_PHONE',
  responsible: 'LEGAL_RESPONSIBLE',
} as const;

type Env = Record<string, string | undefined>;

/**
 * A missing required value becomes a visible placeholder instead of an error,
 * so a template build never fails; `missing` lets the caller warn.
 */
export function resolveLegal(env: Env) {
  const missing: string[] = [];

  const entries = Object.entries(REQUIRED).map(([key, variable]) => {
    const value = env[variable]?.trim();

    if (!value) {
      missing.push(variable);
    }

    return [key, value || `[${variable} fehlt]`];
  });

  const legal = {
    ...(Object.fromEntries(entries) as Record<keyof typeof REQUIRED, string>),
    vatId: env.LEGAL_VAT_ID?.trim() || undefined,
  };

  return { legal, missing };
}
