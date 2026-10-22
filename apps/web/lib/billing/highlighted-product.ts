/** Product the pricing page emphasizes: first subscription, else first product. */
export function highlightedProduct(
  products: Record<string, { mode: 'subscription' | 'payment' }>,
): string | null {
  const entries = Object.entries(products);

  return (
    entries.find(([, p]) => p.mode === 'subscription')?.[0] ??
    entries[0]?.[0] ??
    null
  );
}
