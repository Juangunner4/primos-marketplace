import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, ToggleButtonGroup, ToggleButton, TextField, InputAdornment, Select, MenuItem, ListItem, ListItemAvatar, Avatar, ListItemText, Box, Typography, Accordion, AccordionSummary, AccordionDetails, Button, Stack, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MarketNFT } from './NFTCard';
import { calculateFees } from '../utils/fees';

interface ListItemModalProps {
  open: boolean;
  nft: MarketNFT | null;
  onClose: () => void;
  onConfirm?: (price: number) => void;
}

const ListItemModal: React.FC<ListItemModalProps> = ({ open, nft, onClose, onConfirm }) => {
  const [strategy, setStrategy] = useState('floor');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('SOL');
  if (!nft) return null;

  const numericPrice = parseFloat(price) || 0;
  const fees = numericPrice ? calculateFees(numericPrice) : null;
  const buyerSees = fees ? (numericPrice + fees.totalFees).toFixed(3) : '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        List Items
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: 3 }}>
        <ToggleButtonGroup
          fullWidth
          exclusive
          value={strategy}
          onChange={(e, val) => val && setStrategy(val)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="floor">Floor</ToggleButton>
          <ToggleButton value="trait">Top Trait</ToggleButton>
          <ToggleButton value="ladder">Ladder</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          fullWidth
          label="Custom Global Price"
          variant="outlined"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  size="small"
                >
                  <MenuItem value="SOL">SOL</MenuItem>
                </Select>
              </InputAdornment>
            ),
          }}
        />
        <ListItem disableGutters sx={{ mb: 2 }}>
          <ListItemAvatar>
            <Avatar src={nft.image} />
          </ListItemAvatar>
          <ListItemText primary={nft.name} secondary="Unlisted" />
          <Box>
            <TextField
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              size="small"
            />
            {buyerSees && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Typography variant="caption" color="textSecondary">
                    Buyer sees {buyerSees} {currency}
                  </Typography>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="top" style={{ background: 'black', color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                    {buyerSees} {currency}
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
          </Box>
        </ListItem>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>You Receive</Typography>
            <Typography sx={{ marginLeft: 'auto' }}>{fees ? fees.sellerReceives.toFixed(3) + ' ' + currency : '--'}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary">
              Priority Fee: <Link component="button">Standard</Link>
            </Typography>
            {fees && (
              <Typography variant="body2" color="success.main">
                🍀 Earn up to an additional 0.003 SOL through Lucky Buy
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
        <Stack direction="row" spacing={2} mt={2}>
          <Button variant="outlined" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="secondary" fullWidth onClick={() => onConfirm && onConfirm(numericPrice)}>List 1 Item</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ListItemModal;
