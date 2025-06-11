export interface NftFilters {
  searchQuery: string;
  selectedTraits: Record<string, string[]>;
  priceMin?: number;
  priceMax?: number;
  sortBy: 'priceAsc' | 'priceDesc' | 'newest' | 'rarity';
}
