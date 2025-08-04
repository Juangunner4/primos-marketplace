import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { fetchTokenMetadata, TokenMetadata } from '../services/token';
import { getTokenInfo, HeliusTokenInfo } from '../services/helius';
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
  marketCap?: number;
  holders?: number;
  buys24h?: number;
  tickerBase?: string;
  tickerTarget?: string;
  tickerMarketName?: string;
  tickerMarketIdentifier?: string;
  hasTradingIncentive?: boolean;
}

const ContractPanel: React.FC<ContractPanelProps> = ({ contract, open, onClose }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [tokenInfo, setTokenInfo] = useState<HeliusTokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyContract = () => {
    if (contract) {
      navigator.clipboard.writeText(contract);
    }
  };

  useEffect(() => {
    if (!open || !contract) return;
    setLoading(true);
    setError(null);
    Promise.all([
      Promise.resolve(fetchTokenMetadata(contract)).catch(() => null),
      Promise.resolve(getTokenInfo(contract)).catch((err) => {
        console.error('getTokenInfo error', err);
        return null;
      }),
    ])
      .then(([tok, info]) => {
        setToken(tok);
        setTokenInfo(info);
      })
      .catch(() => setError(t('token_error')))
      .finally(() => setLoading(false));
  }, [open, contract, t]);

  useEffect(() => {
    if (open) return;
    setToken(null);
    setTokenInfo(null);
    setError(null);
    setLoading(false);
  }, [open]);

  const telegramEntries = [
    { id: '1', label: '🌐', type: 'ticker' },
    { id: '2', label: '💹 MCap', key: 'marketCap' },
    { id: '3', label: '💰 USD', key: 'priceUsd' },
    { id: '4', label: '💎 FDV', key: 'fdvUsd' },
    { id: '5', label: '📊 Vol', key: 'volume24hUsd' },
    { id: '6', label: '🛒 Buys', key: 'buys24h' },
    { id: '7', label: '👥 Holders', key: 'holders' },
    { id: '8', label: '📈 1H', key: 'change1hPercent' },
  ].map(({ id, label, key, type }) => {
    let value = '—';
    const data = tokenInfo;
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
        <Dialog.Close asChild>
          <button
            className="contract-close"
            onClick={onClose}
            aria-label={t('close')}
          >
            <CloseIcon fontSize="medium" />
          </button>
        </Dialog.Close>
        {loading && <Typography variant="body2">{t('loading')}...</Typography>}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Box className="contract-panels">
          <Box className="token-panel">
            <Typography className="dialog-title">{t('token_metadata')}</Typography>
            {contract && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', flex: 1 }}>
                  <strong>Contract:</strong> {contract}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCopyContract}
                  aria-label="Copy contract address"
                  sx={{ color: '#000' }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            {token ? (
              <Box className="token-info">
                {token.image && (
                  <Box
                    component="img"
                    src={token.image}
                    alt={token.name}
                    className="token-image"
                  />
                )}
                <Box className="token-metadata">
                  {Object.entries(token)
                    .filter(([k]) => k !== 'image' && (token as any)[k])
                    .map(([k, v]) => (
                      <Typography key={k} variant="body2" sx={{ mb: 1 }}>
                        {k}: {v as string}
                      </Typography>
                    ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2">{t('loading')}...</Typography>
            )}
          </Box>
          <Box className="telegram-panel">
            <Typography className="dialog-title">{t('token_info')}</Typography>
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
