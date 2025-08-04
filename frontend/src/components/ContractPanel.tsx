import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import XIcon from '@mui/icons-material/X';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  fetchTokenMetadata,
  fetchTokenInfo,
  TokenMetadata,
  TokenInfo,
} from '../services/token';
import { fetchTrenchData, TrenchData } from '../services/trench';
import './ContractPanel.css';

interface ContractPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

const ContractPanel: React.FC<ContractPanelProps> = ({ contract, open, onClose }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [callerInfo, setCallerInfo] = useState<{
    publicKey: string;
    pfp: string;
    at?: number;
    marketCap?: number;
    domain?: string;
    twitter?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyContract = () => {
    if (contract) {
      navigator.clipboard.writeText(contract);
    }
  };

  const loadTrenchData = async () => {
    try {
      const d: TrenchData = await fetchTrenchData();
      const rec = d.contracts.find((cc) => cc.contract === contract);
      if (rec?.firstCaller) {
        const user = d.users.find((u) => u.publicKey === rec.firstCaller);
        setCallerInfo({
          publicKey: rec.firstCaller,
          pfp: user?.pfp || '',
          at: rec.firstCallerAt,
          marketCap: rec.firstCallerMarketCap,
          domain: rec.firstCallerDomain,
          twitter: user?.socials?.twitter || '',
        });
      }
    } catch (error) {
      console.error('Failed to load trench data:', error);
    }
  };

  useEffect(() => {
    if (!open || !contract) return;
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      try {
        const [tok, info] = await Promise.all([
          fetchTokenMetadata(contract).catch(() => null),
          fetchTokenInfo(contract).catch((err) => {
            console.error('fetchTokenInfo error', err);
            return null;
          }),
        ]);
        
        setToken(tok);
        setTokenInfo(info);
        await loadTrenchData();
      } catch (error) {
        console.error('Failed to load token data:', error);
        setError(t('token_error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
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
        {/* First caller information */}
        {callerInfo && (
          <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('first_caller')}
            </Typography>
            
            {/* User Info Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }} className="first-caller-avatar-container">
                <Link to={`/user/${callerInfo.publicKey}`} style={{ textDecoration: 'none' }}>
                  <Avatar 
                    src={callerInfo.pfp} 
                    alt={callerInfo.publicKey} 
                    sx={{ width: 40, height: 40, cursor: 'pointer' }} 
                  />
                </Link>
                {callerInfo.twitter && (
                  <IconButton
                    size="small"
                    onClick={() => window.open(`https://x.com/${callerInfo.twitter!.replace(/^@/, '')}`, '_blank')}
                    aria-label="View X profile"
                    sx={{ 
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 20,
                      height: 20,
                      backgroundColor: '#000',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': { 
                        backgroundColor: '#333',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '12px'
                      }
                    }}
                  >
                    <XIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 'bold' }}>
                  {callerInfo.publicKey}
                </Typography>
                {callerInfo.domain && (
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                    {callerInfo.domain}.sol
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Data Columns */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }} className="first-caller-data-columns">
              <Box sx={{ flex: 1, minWidth: '200px', p: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }} className="first-caller-data-box">
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>
                  {t('called_at')}
                </Typography>
                <Typography variant="body2">
                  {callerInfo.at ? new Date(callerInfo.at).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px', p: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }} className="first-caller-data-box">
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>
                  {t('market_cap_at_call')}
                </Typography>
                <Typography variant="body2">
                  {callerInfo.marketCap ? `$${callerInfo.marketCap.toLocaleString()}` : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
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
