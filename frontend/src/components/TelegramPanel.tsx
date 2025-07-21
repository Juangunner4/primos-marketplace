import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import './TelegramPanel.css';

interface TelegramPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

// Data shape returned by TelegramResource
interface TelegramData {
  tokenAddress?: string;
  priceUsd?: number;
  fdvUsd?: number;
  volume24hUsd?: number;
  change1hPercent?: number;
  // First ticker data
  tickerBase?: string;
  tickerTarget?: string;
  tickerMarketName?: string;
  tickerMarketIdentifier?: string;
  hasTradingIncentive?: boolean;
  // Top holders count
  topHolders?: number;
}

const TelegramPanel: React.FC<TelegramPanelProps> = ({ contract, open, onClose }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<TelegramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when panel opens and a contract is selected
  useEffect(() => {
    if (!open || !contract) return;
    setLoading(true);
    setError(null);
    api.get<TelegramData>(`/api/telegram/${contract}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError(t('telegram_error'));
      })
      .finally(() => setLoading(false));
  }, [open, contract, t]);

  // Cleanup state when panel closes
  useEffect(() => {
    if (open) return;
    setData(null);
    setError(null);
    setLoading(false);
  }, [open]);

  // Define entries combining labels and fetched values
  const entries = [
    { id: '1', label: '🌐', type: 'ticker' },
    { id: '2', label: '💹 MCap', key: 'marketCap' },
    { id: '2', label: '💰 USD', key: 'priceUsd' },
    { id: '3', label: '💎 FDV', key: 'fdvUsd' },
    { id: '4', label: '💦 Liq', key: null },
    { id: '5', label: '📊 Vol', key: 'volume24hUsd' },
    { id: '6', label: '📈 1H', key: 'change1hPercent' },
    { id: '7', label: '👥 TH', key: 'topHolders' },
  ].map(({ id, label, key, type }) => {
    let value = '—';
    if (data) {
      if (type === 'ticker' && data.tickerBase && data.tickerTarget && data.tickerMarketName) {
        value = `${data.tickerBase}/${data.tickerTarget} @ ${data.tickerMarketName}`;
      } else if (key) {
        const num = (data as any)[key] as number | undefined;
        if (num != null) {
          value = key === 'change1hPercent'
            ? num.toFixed(2) + '%'
            : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    }
    return { id, message: `${label} ${value}` };
  });

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      {/* Loading and error states */}
      {loading && <Typography variant="body2">{t('loading')}...</Typography>}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
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
