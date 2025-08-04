import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { fetchTokenMetadata, TokenMetadata } from '../services/token';
import api from '../utils/api';
import './ContractPanel.css';

interface ContractPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

interface TelegramData {
  tokenAddress?: string;
  priceUsd?: number;
  fdvUsd?: number;
  volume24hUsd?: number;
  change1hPercent?: number;
  tickerBase?: string;
  tickerTarget?: string;
  tickerMarketName?: string;
  tickerMarketIdentifier?: string;
  hasTradingIncentive?: boolean;
  topHolders?: number;
}

const ContractPanel: React.FC<ContractPanelProps> = ({ contract, open, onClose }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [telegram, setTelegram] = useState<TelegramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contract) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchTokenMetadata(contract).catch(() => null),
      api
        .get<TelegramData>(`/api/telegram/${contract}`)
        .then((res) => res.data)
        .catch((err) => {
          console.error(err);
          return null;
        }),
    ])
      .then(([tok, tel]) => {
        setToken(tok);
        setTelegram(tel);
      })
      .catch(() => setError(t('telegram_error')))
      .finally(() => setLoading(false));
  }, [open, contract, t]);

  useEffect(() => {
    if (open) return;
    setToken(null);
    setTelegram(null);
    setError(null);
    setLoading(false);
  }, [open]);

  const telegramEntries = [
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
    const data = telegram;
    if (data) {
      if (
        type === 'ticker' &&
        data.tickerBase &&
        data.tickerTarget &&
        data.tickerMarketName
      ) {
        value = `${data.tickerBase}/${data.tickerTarget} @ ${data.tickerMarketName}`;
      } else if (key) {
        const num = (data as any)[key] as number | undefined;
        if (num != null) {
          value =
            key === 'change1hPercent'
              ? num.toFixed(2) + '%'
              : num.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
        }
      }
    }
    return { id, message: `${label} ${value}` };
  });

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Overlay className="contract-overlay" />
      <Dialog.Content className="contract-content">
        <IconButton
          className="contract-close"
          onClick={onClose}
          aria-label={t('close')}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        {loading && <Typography variant="body2">{t('loading')}...</Typography>}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Box className="contract-panels">
          <Box className="token-panel">
            <Typography className="dialog-title">{t('token_metadata')}</Typography>
            {token ? (
              <>
                {token.image && (
                  <Box
                    component="img"
                    src={token.image}
                    alt={token.name}
                    className="token-image"
                  />
                )}
                {Object.entries(token)
                  .filter(([k]) => k !== 'image' && (token as any)[k])
                  .map(([k, v]) => (
                    <Typography key={k} variant="body2" sx={{ mb: 1 }}>
                      {k}: {v as string}
                    </Typography>
                  ))}
              </>
            ) : (
              <Typography variant="body2">{t('loading')}...</Typography>
            )}
          </Box>
          <Box className="telegram-panel">
            <Typography className="dialog-title">{t('telegram_data')}</Typography>
            <Box className="telegram-list" sx={{ mt: 1 }}>
              {telegramEntries.map((e) => (
                <Box key={e.id} sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  <Typography variant="body2" component="div">
                    {e.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContractPanel;
