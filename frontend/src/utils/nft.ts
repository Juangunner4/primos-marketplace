export function getNftRank(listing: any, metaAttrs: any): number | null {
  if (typeof listing.rarityRank === 'number') {
    return listing.rarityRank;
  }
  if (typeof listing.rank === 'number') {
    return listing.rank;
  }
  if (metaAttrs) {
    const attr = metaAttrs.find(
      (a: any) =>
        a.trait_type?.toLowerCase() === 'rank' ||
        a.trait_type?.toLowerCase() === 'rarity rank'
    );
    if (attr && !isNaN(Number(attr.value))) {
      return Number(attr.value);
    }
  }
  return null;
}
