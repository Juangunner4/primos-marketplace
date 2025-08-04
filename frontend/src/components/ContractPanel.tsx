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
import { fetchCoinGeckoData, CoinGeckoEntry } from '../services/coingecko';
import './ContractPanel.css';

interface ContractPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
  userCount?: number;
}

const ContractPanel: React.FC<ContractPanelProps> = ({ contract, open, onClose, userCount = 0 }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [coinGeckoData, setCoinGeckoData] = useState<CoinGeckoEntry[]>([]);
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
        const [tok, info, geckoData] = await Promise.all([
          fetchTokenMetadata(contract).catch(() => null),
          fetchTokenInfo(contract).catch((err) => {
            console.error('fetchTokenInfo error', err);
            return null;
          }),
          fetchCoinGeckoData(contract).catch((err) => {
            console.error('fetchCoinGeckoData error', err);
            return [];
          }),
        ]);
        
        setToken(tok);
        setTokenInfo(info);
        setCoinGeckoData(geckoData);
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
    setCoinGeckoData([]);
    setError(null);
    setLoading(false);
  }, [open]);

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
            
            {/* Community Sentiment Info */}
            <Box sx={{ mb: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                📊 {t('community_sentiment')} {userCount > 0 && `(${userCount} ${userCount === 1 ? t('user') : t('users')})`}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#1565c0' }}>
                {userCount > 0 
                  ? t('sentiment_contract_explanation_with_count', { count: userCount })
                  : t('sentiment_contract_explanation')
                }
              </Typography>
            </Box>
            
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
                  {callerInfo.marketCap ? `$${callerInfo.marketCap.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}` : 'N/A'}
                </Typography>
                {callerInfo.marketCap && coinGeckoData.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    📈 {t('compare_with_current')}
                  </Typography>
                )}
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
          <Box className="market-data-panel">
            <Typography className="dialog-title">{t('market_data')}</Typography>
            <Box className="market-data-list" sx={{ mt: 1 }}>
              {coinGeckoData.map((entry) => (
                <Box key={entry.id} sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: '#fafafa', borderRadius: 0.5 }}>
                  <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {entry.message}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                      {entry.value}
                    </Typography>
                    {entry.change && (
                      <Typography 
                        variant="body2" 
                        component="div" 
                        sx={{ 
                          color: entry.change.startsWith('-') ? '#f44336' : '#4caf50',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          backgroundColor: entry.change.startsWith('-') ? '#ffebee' : '#e8f5e8',
                          borderRadius: '4px'
                        }}
                      >
                        {entry.change}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {coinGeckoData.length === 0 && (
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                  {loading ? t('loading') + '...' : 'No market data available'}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContractPanel;
