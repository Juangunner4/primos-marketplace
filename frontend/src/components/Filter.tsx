import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  minPrice: string;
  maxPrice: string;
  minRank: string;
  maxRank: string;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  setMinRank: (v: string) => void;
  setMaxRank: (v: string) => void;
  onClear: () => void;
  onApply: () => void;
}

const MARKETPLACES = [
  { label: "Magic Eden", value: "ME" },
  { label: "Tensor", value: "Tensor" },
  { label: "SOLSniper", value: "SOLSniper" },
  // Add more as needed
];

export function FilterPanel({
  open,
  onClose,
  minPrice,
  maxPrice,
  minRank,
  maxRank,
  setMinPrice,
  setMaxPrice,
  setMinRank,
  setMaxRank,
  onClear,
  onApply,
}: Readonly<FilterPanelProps>) {
  // 1) Marketplaces
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);

  // 2) Price range (min/max) handled by parent

  // 3) Dynamic attributes (traits)
  const ATTRIBUTE_GROUPS: Record<string, string[]> = {
    Color: ["Red", "Blue", "Green"],
    Hat: ["Beanie", "Cap", "None"],
  };
  const [attrs, setAttrs] = useState<Record<string, Set<string>>>({});

  const toggleAttr = (group: string, value: string) => {
    setAttrs((prev) => {
      const next = new Set(prev[group]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [group]: next };
    });
  };

  const handleMarketplaceChange = (value: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  if (!open) return null; // Only render if open

  return (
    <Box
      p={2}
      width={280}
      sx={{
        border: '1px solid #bbb',
        borderRadius: 3,
        boxShadow: '4px 0 24px rgba(226, 194, 117, 0.08)',
        background: '#f5f5f8',
        margin: '0 10px 0 10px',
      }}
    >
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button onClick={onClose} sx={{ minWidth: 0, p: 1, color: '#555' }}>
          <CompareArrowsIcon />
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* 1) Marketplaces */}
      <Typography gutterBottom>Marketplaces</Typography>
      <FormGroup sx={{ mb: 2 }}>
        {MARKETPLACES.map((mp) => (
          <FormControlLabel
            key={mp.value}
            control={
              <Checkbox
                checked={selectedMarketplaces.includes(mp.value)}
                onChange={() => handleMarketplaceChange(mp.value)}
              />
            }
            label={mp.label}
          />
        ))}
      </FormGroup>

      {/* 2) Price Min/Max */}
      <Typography gutterBottom>Price (SOL)</Typography>
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

      {/* Rank Min/Max */}
      <Typography gutterBottom>Rank</Typography>
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

      {/* 3) Attribute Accordions */}
      {Object.entries(ATTRIBUTE_GROUPS).map(([group, options]) => (
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
                  variant={attrs[group]?.has(opt) ? "filled" : "outlined"}
                  onClick={() => toggleAttr(group, opt)}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* 4) Active filters & Apply / Reset */}
      <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
        {selectedMarketplaces.map((mp) => (
          <Chip
            key={mp}
            label={MARKETPLACES.find(m => m.value === mp)?.label || mp}
            onDelete={() => handleMarketplaceChange(mp)}
          />
        ))}
        {minPrice && <Chip label={`Min: ${minPrice}`} onDelete={() => setMinPrice('')} />}
        {maxPrice && <Chip label={`Max: ${maxPrice}`} onDelete={() => setMaxPrice('')} />}
        {minRank && <Chip label={`Rank Min: ${minRank}`} onDelete={() => setMinRank('')} />}
        {maxRank && <Chip label={`Rank Max: ${maxRank}`} onDelete={() => setMaxRank('')} />}
        {Object.entries(attrs).flatMap(([g, set]) =>
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
            setSelectedMarketplaces([]);
            setAttrs({});
            setMinPrice('');
            setMaxPrice('');
            setMinRank('');
            setMaxRank('');
            onClear();
          }}
        >
          Reset
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
            onClose();
          }}
        >
          Apply
        </Button>
      </Box>
    </Box>
  );
}

export default FilterPanel;
