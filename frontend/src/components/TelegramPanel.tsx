import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { fetchTelegramData, TelegramEntry } from '../services/telegram';
import './TelegramPanel.css';

interface TelegramPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

const TelegramPanel: React.FC<TelegramPanelProps> = ({ contract, open, onClose }) => {
  const [entries, setEntries] = useState<TelegramEntry[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!contract || !open) return;
    fetchTelegramData(contract).then(setEntries);
  }, [contract, open]);

  if (!contract) return null;

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
        <Box className="telegram-list">
          {entries.map((e) => (
            <Box key={e.id} className="telegram-row">
              <Typography variant="body2">{e.message}</Typography>
              <Typography variant="caption">
                {new Date(e.time).toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default TelegramPanel;
