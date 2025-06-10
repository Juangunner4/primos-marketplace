import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import './Filter.css';

type FilterProps = {
  minPrice: string;
  maxPrice: string;
  minRank: string;
  maxRank: string;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setMinRank: (v: string) => void;
  setMaxRank: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

const Filter: React.FC<FilterProps> = ({
  minPrice,
  maxPrice,
  minRank,
  maxRank,
  setMinPrice,
  setMaxPrice,
  setMinRank,
  setMaxRank,
  onApply,
  onClear,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="filter-panel">
      <Typography variant="h6" component="h3" className="filter-title">
        {t('filters')}
      </Typography>
      <Box className="filter-group">
        <Typography variant="subtitle2">{t('filter_price')}</Typography>
        <TextField
          type="number"
          label="Min"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 1 }}
        />
        <TextField
          type="number"
          label="Max"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>
      <Box className="filter-group">
        <Typography variant="subtitle2">{t('filter_rank')}</Typography>
        <TextField
          type="number"
          label="Min"
          value={minRank}
          onChange={(e) => setMinRank(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 1 }}
        />
        <TextField
          type="number"
          label="Max"
          value={maxRank}
          onChange={(e) => setMaxRank(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>
      <Box className="filter-actions">
        <Button
          variant="contained"
          onClick={() => {
            onApply();
            onClose();
          }}
          sx={{ mr: 1 }}
        >
          {t('apply_filters')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onClear();
          }}
        >
          {t('clear_filters')}
        </Button>
      </Box>
    </Box>
  );
};

export default Filter;