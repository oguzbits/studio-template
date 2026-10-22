import studioConfig from '~/config/studio.config';

export function costEur(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number | null {
  const price = studioConfig.ai.prices[model];

  if (!price) return null;

  return (
    (tokensIn * price.inEurPerMTok + tokensOut * price.outEurPerMTok) /
    1_000_000
  );
}
