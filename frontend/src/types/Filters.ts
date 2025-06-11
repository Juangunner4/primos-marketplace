export interface NftFilters {
  searchQuery: string;
  selectedTraits: Record<string, string[]>; // traitType → list of values
  priceMin?: number;
  priceMax?: number;
  sortBy: 'priceAsc' | 'priceDesc' | 'newest' | 'rarity';
}
