import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import XIcon from '@mui/icons-material/X';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import { GiSlingshot, GiAtom } from 'react-icons/gi';
import { FaVectorSquare } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  fetchTokenMetadata,
  fetchTokenInfo,
  TokenMetadata,
  TokenInfo,
} from '../services/token';
import { fetchTrenchData, TrenchData, TrenchCallerInfo } from '../services/trench';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
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
  const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION ?? '';
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
    slingshot?: string;
    axiom?: string;
    vector?: string;
  } | null>(null);
  const [latestCallers, setLatestCallers] = useState<TrenchCallerInfo[]>([]);
  const [marketCapLoading, setMarketCapLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format large numbers into human-readable strings with suffixes
  const formatMarketCap = (cap: number): string => {
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`;
    return `$${cap.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const geckoIcons: Record<string, JSX.Element> = {
    price: <AttachMoneyIcon fontSize="small" />,
    market_cap: <BarChartIcon fontSize="small" />,
    volume_24h: <TrendingUpIcon fontSize="small" />,
    last_updated: <AutorenewIcon fontSize="small" />,
  };

  const formatSlingshotUrl = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://slingshot.app/signup?code=${trimmed.replace(/^@/, '')}`;
  };

  const formatVectorUrl = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://vec.fun/ref/${trimmed.replace(/^@/, '')}`;
  };

  const formatAxiomUrl = (handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://axiom.trade/@${trimmed.replace(/^@/, '')}`;
  };

  const handleCopyContract = () => {
    if (contract) {
      navigator.clipboard.writeText(contract);
    }
  };

  const loadTrenchData = async () => {
    setMarketCapLoading(true);
    setCallerInfo((prev) =>
      prev ? { ...prev, marketCap: undefined } : prev
    );
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
          slingshot: user?.socials?.slingshot || '',
          axiom: user?.socials?.axiom || '',
          vector: user?.socials?.vector || '',
        });
      }
      
      // Set latest callers for this contract and load their images individually
      if (contract && d.latestCallers[contract]) {
        const callersWithImages = await Promise.all(
          d.latestCallers[contract].map(async (c) => {
            let image = '';
            const pfpAddr = c.pfp?.replace(/"/g, '');
            if (pfpAddr) {
              const nft = await getNFTByTokenAddress(pfpAddr);
              image = nft?.image || '';
            } else if (PRIMO_COLLECTION) {
              const nfts = await fetchCollectionNFTsForOwner(
                c.caller,
                PRIMO_COLLECTION
              );
              image = nfts[0]?.image || '';
            }
            return { ...c, pfp: image } as TrenchCallerInfo;
          })
        );
        setLatestCallers(callersWithImages);
      }
    } catch (error) {
      console.error('Failed to load trench data:', error);
    } finally {
      setMarketCapLoading(false);
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
    setCallerInfo(null);
    setLatestCallers([]);
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
          <Box sx={{ mb: 2, p: 2, border: '1px solid #fff', borderRadius: 1, backgroundColor: '#000', color: '#fff' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('first_caller')}
            </Typography>

            {/* Community Sentiment Info */}
            <Box sx={{ mb: 2, p: 1, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #fff' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BarChartIcon fontSize="small" />
                {t('community_sentiment')} {userCount > 0 && `(${userCount} ${userCount === 1 ? t('user') : t('users')})`}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#000' }}>
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
                    alt={t('caller_pfp_alt')}
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
                {callerInfo.slingshot && (
                  <IconButton
                    size="small"
                    onClick={() => window.open(formatSlingshotUrl(callerInfo.slingshot!), '_blank')}
                    aria-label={t('slingshot')}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      left: -8,
                      width: 20,
                      height: 20,
                      backgroundColor: '#5E17EB',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': {
                        backgroundColor: '#7B3FF2',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    <GiSlingshot size={12} />
                  </IconButton>
                )}
                {callerInfo.vector && (
                  <IconButton
                    size="small"
                    onClick={() => window.open(formatVectorUrl(callerInfo.vector!), '_blank')}
                    aria-label={t('vector')}
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      left: -8,
                      width: 20,
                      height: 20,
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': {
                        backgroundColor: '#115293',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    <FaVectorSquare size={12} />
                  </IconButton>
                )}
                {callerInfo.axiom && (
                  <IconButton
                    size="small"
                    onClick={() => window.open(formatAxiomUrl(callerInfo.axiom!), '_blank')}
                    aria-label={t('axiom')}
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      width: 20,
                      height: 20,
                      backgroundColor: '#e53935',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    <GiAtom size={12} />
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
              <Box sx={{ flex: 1, minWidth: '200px', p: 1, backgroundColor: '#fafafa', borderRadius: 1 }} className="first-caller-data-box">
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>
                  {t('called_at')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>
                  {callerInfo.at ? new Date(callerInfo.at).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px', p: 1, backgroundColor: '#fafafa', borderRadius: 1 }} className="first-caller-data-box">
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333', mb: 0.5 }}>
                  {t('market_cap_at_call')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#000' }}>
                  {(() => {
                    if (marketCapLoading) return `${t('loading')}...`;
                    if (callerInfo.marketCap != null) return formatMarketCap(callerInfo.marketCap);
                    return 'N/A';
                  })()}
                </Typography>
                {callerInfo.marketCap && !marketCapLoading && coinGeckoData.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="inherit" />
                    {t('compare_with_current')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Latest Callers */}
        {latestCallers.length > 0 && (
          <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('latest_4_callers')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {latestCallers.map((caller, index) => (
                <Box 
                  key={`${caller.caller}-${index}`} 
                  sx={{ 
                    p: 1.5, 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: 1, 
                    border: '1px solid #ddd' 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Link to={`/user/${caller.caller}`} style={{ textDecoration: 'none' }}>
                        <Avatar
                          src={caller.pfp}
                          alt={t('caller_pfp_alt')}
                          sx={{ width: 32, height: 32, cursor: 'pointer' }}
                        />
                      </Link>
                      {caller.socials?.twitter && (
                        <IconButton
                          size="small"
                          onClick={() => window.open(`https://x.com/${caller.socials!.twitter!.replace(/^@/, '')}`, '_blank')}
                          aria-label="View X profile"
                          sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 16,
                            height: 16,
                            backgroundColor: '#000',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#333' },
                            '& .MuiSvgIcon-root': { fontSize: '10px' }
                          }}
                        >
                          <XIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ 
                        wordBreak: 'break-all', 
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {caller.caller}
                      </Typography>
                      {caller.domainAtCall && (
                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem' }}>
                          {caller.domainAtCall}.sol
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                      {t('called_at')}: {caller.calledAt ? new Date(caller.calledAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                    {caller.marketCapAtCall && (
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                        {t('market_cap_at_call')}: {formatMarketCap(caller.marketCapAtCall)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {geckoIcons[entry.id]}
                    <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {t(entry.label)}
                    </Typography>
                  </Box>
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
                  {loading ? `${t('loading')}...` : t('no_market_data')}
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
