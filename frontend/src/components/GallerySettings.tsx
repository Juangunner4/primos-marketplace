import React, { useState } from 'react';
import FilterPanel from './Filter';
import { ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import ExpandIcon from '@mui/icons-material/Expand';
import CloseIcon from '@mui/icons-material/Close';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useTranslation } from 'react-i18next';

export type GalleryView = 'grid9' | 'grid4' | 'list';

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
  const [filterOpen, setFilterOpen] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <IconButton onClick={() => setFilterOpen(o => !o)} size="small" aria-label={filterOpen ? t('close') : t('open_filters')}>
          {filterOpen ? <CloseIcon /> : <ExpandIcon />}
        </IconButton>
      </div>
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
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
        <ToggleButton value="grid9" aria-label={t('gallery_view_grid9')}>
          <ViewModuleIcon />
        </ToggleButton>
        <ToggleButton value="grid4" aria-label={t('gallery_view_grid4')}>
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
