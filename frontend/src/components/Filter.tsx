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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
}

export function FilterPanel({ open, onClose }: Readonly<FilterPanelProps>) {
  // 1) Collection search
  const [collection, setCollection] = useState<string | null>(null);

  // 2) Price range
  const [priceRange, setPriceRange] = useState<number[]>([0, 10]);

  // 3) Dynamic attributes
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

  if (!open) return null; // Only render if open

  return (
    <Box p={2} width={280}>
      <Button onClick={onClose} sx={{ mb: 2 }}>
        Close
      </Button>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* 1) Collection Autocomplete */}
      <Autocomplete
        options={[]}
        value={collection}
        onChange={(_, v) => setCollection(v)}
        renderInput={(params) => (
          <TextField {...params} label="Collection" size="small" />
        )}
        sx={{ mb: 3 }}
      />

      {/* 2) Price Slider */}
      <Typography gutterBottom>Price (SOL)</Typography>
      <Slider
        value={priceRange}
        onChange={(_, v) => setPriceRange(v)}
        valueLabelDisplay="auto"
        min={0}
        max={20}
        step={0.01}
        sx={{ mb: 3 }}
      />

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
        {collection && <Chip label={collection} onDelete={() => setCollection(null)} />}
        {Object.entries(attrs).flatMap(([g, set]) =>
          Array.from(set).map((v) => (
            <Chip key={`${g}-${v}`} label={`${g}: ${v}`} onDelete={() => toggleAttr(g, v)} />
          ))
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          size="small"
          onClick={() => {
            setCollection(null);
            setPriceRange([0, 10]);
            setAttrs({});
          }}
        >
          Reset
        </Button>
        <Button variant="contained" size="small" onClick={() => {}}>
          Apply
        </Button>
      </Box>
    </Box>
  );
}

export default FilterPanel;
