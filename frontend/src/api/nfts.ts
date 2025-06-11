import { NftFilters } from '../types/Filters';

export async function fetchNfts(filters: NftFilters) {
  const params = new URLSearchParams();
  if (filters.searchQuery) params.set('q', filters.searchQuery);
  if (filters.priceMin != null) params.set('min_price', filters.priceMin.toString());
  if (filters.priceMax != null) params.set('max_price', filters.priceMax.toString());
  params.set('sort', filters.sortBy);

  // Traits: flatten as traitType:values CSV
  Object.entries(filters.selectedTraits).forEach(([type, vals]) => {
    if (vals.length) params.set(type, vals.join(','));
  });

  const res = await fetch(`/api/nfts?${params.toString()}`);
  return res.json() as Promise<{
    items: any[];
    availableTraits: Record<string, string[]>;
  }>;
}
