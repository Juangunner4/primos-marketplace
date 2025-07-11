/**
 * Returns a color associated with an NFT rank percentile.
 * @param rank The rank position of the NFT.
 * @param totalSupply Total supply of NFTs in the collection.
 * @returns A hex color string representing the rank tier.
 */
export function getRankColor(rank: number | null, totalSupply: number | null): string {
  if (!rank || !totalSupply) return '#b87333';
  const pct = rank / totalSupply;
  if (pct <= 0.01) return '#e5e4e2';
  if (pct <= 0.05) return '#FFD700';
  if (pct <= 0.2) return '#C0C0C0';
  return '#b87333';
}
