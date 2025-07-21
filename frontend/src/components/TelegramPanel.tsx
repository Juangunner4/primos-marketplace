import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import './TelegramPanel.css';

interface TelegramPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

const TelegramPanel: React.FC<TelegramPanelProps> = ({ contract, open, onClose }) => {
  const [entries] = useState<{id: string; message: string;}[]>([
    { id: '1', message: '🌐 Solana @ Raydium —' },
    { id: '2', message: '💰 USD: —' },
    { id: '3', message: '💎 FDV: —' },
    { id: '4', message: '💦 Liq: —' },
    { id: '5', message: '📊 Vol: —' },
    { id: '6', message: '📈 1H: —' },
    { id: '7', message: '👥 TH: —' },
    { id: '8', message: '🤝 Total: —' },
    { id: '9', message: '🌱 Fresh 1D: —' },
  ]);
  const { t } = useTranslation();



  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Overlay className="telegram-overlay" />
      <Dialog.Content className="telegram-content">
        <IconButton
          className="telegram-close"
          onClick={onClose}
          aria-label={t('close')}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('telegram_data')}
        </Typography>
        <Box className="telegram-list" sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
          {entries.map((e) => (
            <Box key={e.id} sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              <Typography variant="body2" component="div">
                {e.message}
              </Typography>
            </Box>
          ))}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default TelegramPanel;
