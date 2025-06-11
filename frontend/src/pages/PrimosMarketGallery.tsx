import React, { useState, useEffect } from 'react';
import { NftFilter } from '../components/NftFilter';
import { NftFilters } from '../types/Filters';
import { fetchNfts } from '../api/nfts';
import './PrimosMarketGallery.css';
import NFTCard from '../components/NFTCard';

export const PrimosMarketGallery: React.FC = () => {
  const [filters, setFilters] = useState<NftFilters>({
    searchQuery: '',
    selectedTraits: {},
    priceMin: undefined,
    priceMax: undefined,
    sortBy: 'priceAsc',
  });
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTraits, setAvailableTraits] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLoading(true);
    fetchNfts(filters)
      .then(data => {
        setNfts(data.items);
        setAvailableTraits(data.availableTraits);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="gallery-page">
      <NftFilter
        filters={filters}
        onChange={upd => setFilters(f => ({ ...f, ...upd }))}
        availableTraits={availableTraits}
      />
      <main className="nft-grid">
        {loading ? (
          <p>Loading…</p>
        ) : (
          nfts.map(nft => <NFTCard key={nft.mint} nft={nft} />)
        )}
      </main>
    </div>
  );
};

export default PrimosMarketGallery;
