export function isAdmin(
  email: string | null | undefined,
  list: string | undefined,
): boolean {
  const e = email?.trim().toLowerCase();

  if (!e || !list) {
    return false;
  }

  return list
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(e);
}

/** Active subscriptions per product key × monthly price; no price or unknown key counts 0. */
export function computeMrr(
  counts: Record<string, number>,
  products: Record<string, { priceMonthlyEur?: number }>,
): number {
  return Object.entries(counts).reduce(
    (sum, [key, n]) => sum + n * (products[key]?.priceMonthlyEur ?? 0),
    0,
  );
}
