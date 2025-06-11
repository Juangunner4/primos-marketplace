import React from 'react';
import { NftFilters } from '../types/Filters';

type Props = {
  filters: NftFilters;
  onChange: (upd: Partial<NftFilters>) => void;
  availableTraits: Record<string, string[]>;
};

export const NftFilter: React.FC<Props> = ({ filters, onChange, availableTraits }) => (
  <aside className="filter-sidebar">
    {/* Search */}
    <input
      type="text"
      placeholder="Search NFTs…"
      value={filters.searchQuery}
      onChange={e => onChange({ searchQuery: e.target.value })}
    />

    {/* Traits */}
    {Object.entries(availableTraits).map(([traitType, values]) => (
      <div key={traitType} className="filter-section">
        <h4>{traitType}</h4>
        {values.map(val => (
          <label key={val}>
            <input
              type="checkbox"
              checked={filters.selectedTraits[traitType]?.includes(val) || false}
              onChange={e => {
                const prev = filters.selectedTraits[traitType] || [];
                const next = e.target.checked
                  ? [...prev, val]
                  : prev.filter(x => x !== val);
                onChange({
                  selectedTraits: {
                    ...filters.selectedTraits,
                    [traitType]: next,
                  },
                });
              }}
            />
            {val}
          </label>
        ))}
      </div>
    ))}

    {/* Price */}
    <div className="filter-section">
      <h4>Price (SOL)</h4>
      <input
        type="number"
        placeholder="Min"
        value={filters.priceMin ?? ''}
        onChange={e => onChange({ priceMin: Number(e.target.value) })}
      />
      <input
        type="number"
        placeholder="Max"
        value={filters.priceMax ?? ''}
        onChange={e => onChange({ priceMax: Number(e.target.value) })}
      />
    </div>

    {/* Sort */}
    <div className="filter-section">
      <h4>Sort by</h4>
      <select
        value={filters.sortBy}
        onChange={e => onChange({ sortBy: e.target.value as any })}
      >
        <option value="priceAsc">Price: Low to High</option>
        <option value="priceDesc">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="rarity">Rarity</option>
      </select>
    </div>

    {/* Clear All */}
    <button
      onClick={() =>
        onChange({
          searchQuery: '',
          selectedTraits: {},
          priceMin: undefined,
          priceMax: undefined,
          sortBy: 'priceAsc',
        })
      }
    >
      Clear All
    </button>
  </aside>
);
