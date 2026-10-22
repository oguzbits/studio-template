/**
 * Check if the code is running in a browser environment.
 */
export function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * @name formatCurrency
 * @description Format the currency based on the currency code
 */
export function formatCurrency(params: {
  currencyCode: string;
  locale: string;
  value: string | number;
}) {
  return new Intl.NumberFormat(params.locale, {
    style: 'currency',
    currency: params.currencyCode,
  }).format(Number(params.value));
}

/**
 * @name isInternalPath
 * @description True only for same-origin paths ("/home"). Resolves like a
 * browser does (tabs/newlines stripped, "\\" treated as "/"), so "//x",
 * "/\\x" and "/\t/x" are rejected. Use for any `next` redirect.
 */
export function isInternalPath(
  path: string | null | undefined,
): path is string {
  if (!path?.startsWith('/')) {
    return false;
  }

  const base = 'http://internal.invalid';

  try {
    return new URL(path, base).origin === base;
  } catch {
    return false;
  }
}
