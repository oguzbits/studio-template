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
 * @description True for same-origin paths ("/home"), false for absolute,
 * protocol-relative ("//x", "/\x") or scheme URLs. Use for any `next` redirect.
 */
export function isInternalPath(
  path: string | null | undefined,
): path is string {
  return !!path && path.startsWith('/') && !/^\/[/\\]/.test(path);
}
