import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
} from "@mui/material";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from 'react-i18next';


export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  inline?: boolean;
  minPrice: string;
  maxPrice: string;
  minRank: string;
  maxRank: string;
  attributeGroups: Record<string, string[]>;
  selectedAttributes: Record<string, Set<string>>;
  setSelectedAttributes: (v: Record<string, Set<string>> | ((prev: Record<string, Set<string>>) => Record<string, Set<string>>)) => void;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setMinRank: (v: string) => void;
  setMaxRank: (v: string) => void;
  onClear: () => void;
  onApply: () => void;
}


export function FilterPanel({
  open,
  onClose,
  inline = false,
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
  onClear,
  onApply,
}: Readonly<FilterPanelProps>) {
  const { t } = useTranslation();

  const toggleAttr = (group: string, value: string) => {
    setSelectedAttributes((prev: Record<string, Set<string>>) => {
      const next = new Set(prev[group] ?? []);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [group]: next };
    });
  };

  if (!open) return null;

  return (
    <Box
      p={2}
      width={inline ? '100%' : 280}
      className={inline ? 'market-filter-sticky' : undefined}
      sx={{
        border: '1px solid #bbb',
        borderRadius: 3,
        boxShadow: inline
          ? '0 2px 8px rgba(0,0,0,0.08)'
          : '4px 0 24px rgba(226, 194, 117, 0.08)',
        background: '#f5f5f8',
        margin: inline ? '0 0 1rem 0' : '0 10px 0 10px',
      }}
    >
      {!inline && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button onClick={onClose} sx={{ minWidth: 0, p: 1, color: '#555' }}>
            <CompareArrowsIcon />
          </Button>
        </Box>
      )}
      <Typography variant="h6" gutterBottom>
        {t('filters')}
      </Typography>

      <Typography gutterBottom>{t('filter_price')} (SOL)</Typography>
      <Box display="flex" gap={1} mb={3}>
        <TextField
          label="Min"
          type="number"
          size="small"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Max"
          type="number"
          size="small"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Box>

      <Typography gutterBottom>{t('filter_rank')}</Typography>
      <Box display="flex" gap={1} mb={3}>
        <TextField
          label="Min"
          type="number"
          size="small"
          value={minRank}
          onChange={e => setMinRank(e.target.value)}
          inputProps={{ min: 1, step: 1 }}
        />
        <TextField
          label="Max"
          type="number"
          size="small"
          value={maxRank}
          onChange={e => setMaxRank(e.target.value)}
          inputProps={{ min: 1, step: 1 }}
        />
      </Box>

  {Object.entries(attributeGroups).map(([group, options]) => (
        <Accordion key={group} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{group}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight={200} overflow="auto">
              {options.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  size="small"
                  variant={selectedAttributes[group]?.has(opt) ? "filled" : "outlined"}
                  onClick={() => toggleAttr(group, opt)}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
        {minPrice && <Chip label={`Min: ${minPrice}`} onDelete={() => setMinPrice('')} />}
        {maxPrice && <Chip label={`Max: ${maxPrice}`} onDelete={() => setMaxPrice('')} />}
        {minRank && <Chip label={`Rank Min: ${minRank}`} onDelete={() => setMinRank('')} />}
        {maxRank && <Chip label={`Rank Max: ${maxRank}`} onDelete={() => setMaxRank('')} />}
        {Object.entries(selectedAttributes).flatMap(([g, set]) =>
          Array.from(set).map((v) => (
            <Chip key={`${g}-${v}`} label={`${g}: ${v}`} onDelete={() => toggleAttr(g, v)} />
          ))
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          size="small"
          variant="outlined"
          sx={{
            color: '#222',
            borderColor: '#222',
            background: '#fff',
            '&:hover': {
              background: '#f5f5f5',
              borderColor: '#000',
            },
          }}
          onClick={() => {
            setSelectedAttributes({});
            setMinPrice('');
            setMaxPrice('');
            setMinRank('');
            setMaxRank('');
            onClear();
          }}
        >
          {t('clear_filters')}
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{
            background: '#222',
            color: '#fff',
            boxShadow: 'none',
            '&:hover': {
              background: '#000',
              color: '#fff',
              boxShadow: 'none',
            },
          }}
          onClick={() => {
            onApply();
            if (!inline) onClose();
          }}
        >
          {t('apply_filters')}
        </Button>
      </Box>
    </Box>
  );
}

export default FilterPanel;
