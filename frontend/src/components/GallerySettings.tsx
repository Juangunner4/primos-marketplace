import React from 'react';
import FilterPanel from './Filter';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useTranslation } from 'react-i18next';

export type GalleryView = 'full' | 'four' | 'list';

interface GallerySettingsProps {
  minPrice: string;
  maxPrice: string;
  minRank: string;
  maxRank: string;
  attributeGroups: Record<string, string[]>;
  selectedAttributes: Record<string, Set<string>>;
  setSelectedAttributes: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setMinRank: (v: string) => void;
  setMaxRank: (v: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  view: GalleryView;
  onViewChange: (v: GalleryView) => void;
}

const GallerySettings: React.FC<GallerySettingsProps> = ({
  minPrice,
  maxPrice,
  minRank,
  maxRank,
  attributeGroups,
  selectedAttributes,
  setSelectedAttributes,
  setMinPrice,
  setMaxPrice,
  setMinRank,
  setMaxRank,
  onClearFilters,
  onApplyFilters,
  view,
  onViewChange,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
      <FilterPanel
        open={true}
        onClose={() => {}}
        inline
        minPrice={minPrice}
        maxPrice={maxPrice}
        minRank={minRank}
        maxRank={maxRank}
        attributeGroups={attributeGroups}
        selectedAttributes={selectedAttributes}
        setSelectedAttributes={setSelectedAttributes}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        setMinRank={setMinRank}
        setMaxRank={setMaxRank}
        onClear={onClearFilters}
        onApply={onApplyFilters}
      />
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, val) => val && onViewChange(val)}
        size="small"
        aria-label={t('gallery_settings')}
      >
        <ToggleButton value="full" aria-label={t('gallery_view_full')}>
          <ViewModuleIcon />
        </ToggleButton>
        <ToggleButton value="four" aria-label={t('gallery_view_four')}>
          <ViewComfyIcon />
        </ToggleButton>
        <ToggleButton value="list" aria-label={t('gallery_view_list')}>
          <ViewListIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default GallerySettings;
