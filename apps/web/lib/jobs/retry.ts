/** Delay before the next try; attempts is the count after the claim (1 → 60 s). */
export function retryDelayMs(attempts: number): number {
  return 30_000 * 2 ** attempts;
}
