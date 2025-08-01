import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, ToggleButtonGroup, ToggleButton, TextField, InputAdornment, ListItem, ListItemAvatar, Avatar, ListItemText, Box, Typography, Accordion, AccordionSummary, AccordionDetails, Button, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MarketNFT } from './NFTCard';
import { calculateFees } from '../utils/fees';
import './NFTCard.css';

interface ListItemModalProps {
  open: boolean;
  nft: MarketNFT | null;
  onClose: () => void;
  onConfirm?: (price: number) => void;
}

const ListItemModal: React.FC<ListItemModalProps> = ({ open, nft, onClose, onConfirm }) => {
  const [strategy, setStrategy] = useState('floor');
  const [price, setPrice] = useState('');
  const theme = useTheme();
  const fullScreenMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (!nft) return null;

  const numericPrice = parseFloat(price) || 0;
  const fees = numericPrice ? calculateFees(numericPrice) : null;
  const buyerSees = fees ? (numericPrice + fees.totalFees).toFixed(3) : '';

  return (
    <Tooltip.Provider>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreenMobile}
        BackdropProps={{ className: 'nft-dialog-overlay' }}
        PaperProps={{ className: 'nft-dialog-content' }}
        fullWidth
        maxWidth="sm"
        sx={(theme) => ({
          '& .MuiDialog-container': {
            alignItems: fullScreenMobile ? 'stretch' : 'flex-start',
          },
          '& .MuiPaper-root': {
            borderRadius: fullScreenMobile ? 0 : 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[24],
            width: fullScreenMobile ? '100vw' : 600,
            // auto height to fit content and reduce whitespace
            height: 'auto',
            maxWidth: fullScreenMobile ? '100vw' : '90vw',
            maxHeight: fullScreenMobile ? '100vh' : '80vh',
          },
        })}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          List Items
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 3, overflowY: 'auto' }}>
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
            InputProps={{ endAdornment: <InputAdornment position="end">SOL</InputAdornment> }}
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
                      Buyer sees {buyerSees} SOL
                    </Typography>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="top" style={{ background: 'black', color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                      {buyerSees} SOL
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
            </Box>
          </ListItem>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>You Receive</Typography>
              <Typography sx={{ marginLeft: 'auto' }}>{fees ? fees.sellerReceives.toFixed(3) + ' SOL' : '--'}</Typography>
            </AccordionSummary>
        <AccordionDetails>
          {/* Priority Fee and Lucky Buy details removed */}
        </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 2 }}>
          <Button variant="outlined" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => onConfirm && onConfirm(numericPrice)}>List 1 Item</Button>
        </DialogActions>
      </Dialog>
    </Tooltip.Provider>
  );
};

export default ListItemModal;
