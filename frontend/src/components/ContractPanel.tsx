import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import XIcon from '@mui/icons-material/X';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleIcon from '@mui/icons-material/People';
import PoolIcon from '@mui/icons-material/Pool';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { GiSlingshot, GiAtom } from 'react-icons/gi';
import { FaVectorSquare } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  fetchTokenMetadata,
  fetchNFTMetadataWithBackup,
  fetchTokenInfo,
  TokenMetadata,
  TokenInfo,
} from '../services/token';
import { fetchTrenchData, TrenchData, TrenchCallerInfo } from '../services/trench';
import { fetchCoinGeckoData, CoinGeckoEntry, fetchTokenPools, LiquidityPool } from '../services/coingecko';
import { getTokenLargestAccounts, TokenHolder } from '../services/helius';
import { fetchUserPfpImage } from '../services/user';
import { getLikes, toggleLike } from '../utils/likes';
import { getTokenReactions, toggleTokenLike, toggleTokenDislike, TokenReactionData } from '../utils/tokenReactions';
import './ContractPanel.css';

interface ContractPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
  userCount?: number;
}

const ContractPanel: React.FC<ContractPanelProps> = ({ contract, open, onClose, userCount = 0 }) => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();
  
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [enhancedToken, setEnhancedToken] = useState<TokenMetadata | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [coinGeckoData, setCoinGeckoData] = useState<CoinGeckoEntry[]>([]);
  const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>([]);
  const [holdersExpanded, setHoldersExpanded] = useState(false);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [poolsExpanded, setPoolsExpanded] = useState(false);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [tokenLikes, setTokenLikes] = useState<{ count: number; liked: boolean }>({ count: 0, liked: false });
  const [tokenReactions, setTokenReactions] = useState<TokenReactionData>({ likes: 0, dislikes: 0, userReaction: null });
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
        let pfp = user?.pfp || '';
        if (!pfp) {
          pfp = await fetchUserPfpImage(rec.firstCaller);
        }
        setCallerInfo({
          publicKey: rec.firstCaller,
          pfp,
          at: rec.firstCallerAt,
          marketCap: rec.firstCallerMarketCap,
          domain: rec.firstCallerDomain,
          twitter: user?.socials?.twitter || '',
          slingshot: user?.socials?.slingshot || '',
          axiom: user?.socials?.axiom || '',
          vector: user?.socials?.vector || '',
        });
      }
      
      // Set latest callers for this contract
      if (contract && d.latestCallers[contract]) {
        setLatestCallers(d.latestCallers[contract]);
      }
    } catch (error) {
      console.error('Failed to load trench data:', error);
    } finally {
      setMarketCapLoading(false);
    }
  };

  const loadTokenHolders = async () => {
    if (!contract) return;
    setHoldersLoading(true);
    try {
      const holders = await getTokenLargestAccounts(contract, 10);
      setTokenHolders(holders);
    } catch (error) {
      console.error('Failed to load token holders:', error);
    } finally {
      setHoldersLoading(false);
    }
  };

  const handleHoldersToggle = () => {
    setHoldersExpanded(!holdersExpanded);
    if (!holdersExpanded && tokenHolders.length === 0) {
      loadTokenHolders();
    }
  };

  const loadLiquidityPools = async () => {
    if (!contract) return;
    setPoolsLoading(true);
    try {
      const pools = await fetchTokenPools(contract, 'solana', 5);
      setLiquidityPools(pools);
    } catch (error) {
      console.error('Failed to load liquidity pools:', error);
    } finally {
      setPoolsLoading(false);
    }
  };

  const handlePoolsToggle = () => {
    setPoolsExpanded(!poolsExpanded);
    if (!poolsExpanded && liquidityPools.length === 0) {
      loadLiquidityPools();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTokenAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return num.toFixed(2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadTokenLikes = async () => {
    if (!contract) return;
    try {
      const likes = await getLikes(contract, wallet);
      setTokenLikes(likes);
    } catch (error) {
      console.error('Failed to load token likes:', error);
      setTokenLikes({ count: 0, liked: false });
    }
  };

  const loadTokenReactions = async () => {
    if (!contract) return;
    try {
      const reactions = await getTokenReactions(contract, wallet);
      setTokenReactions(reactions);
    } catch (error) {
      console.error('Failed to load token reactions:', error);
      setTokenReactions({ likes: 0, dislikes: 0, userReaction: null });
    }
  };

  const handleToggleTokenLike = async () => {
    if (!contract || !wallet) return;
    try {
      const result = await toggleLike(contract, wallet);
      setTokenLikes(result);
    } catch (error) {
      console.error('Failed to toggle token like:', error);
    }
  };

  const handleToggleTokenReactionLike = async () => {
    if (!contract || !wallet) return;
    try {
      const result = await toggleTokenLike(contract, wallet);
      setTokenReactions(result);
    } catch (error) {
      console.error('Failed to toggle token like:', error);
    }
  };

  const handleToggleTokenReactionDislike = async () => {
    if (!contract || !wallet) return;
    try {
      const result = await toggleTokenDislike(contract, wallet);
      setTokenReactions(result);
    } catch (error) {
      console.error('Failed to toggle token dislike:', error);
    }
  };

  useEffect(() => {
    if (!open || !contract) return;
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      try {
        const [tok, enhancedTok, info, geckoData] = await Promise.all([
          fetchTokenMetadata(contract).catch(() => null),
          fetchNFTMetadataWithBackup(contract, process.env.REACT_APP_PRIMOS_COLLECTION).catch(() => null),
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
        setEnhancedToken(enhancedTok);
        setTokenInfo(info);
        setCoinGeckoData(geckoData);
        await loadTrenchData();
        await loadTokenLikes();
        await loadTokenReactions();
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
    setTokenHolders([]);
    setHoldersExpanded(false);
    setHoldersLoading(false);
    setLiquidityPools([]);
    setPoolsExpanded(false);
    setPoolsLoading(false);
    setTokenLikes({ count: 0, liked: false });
    setTokenReactions({ likes: 0, dislikes: 0, userReaction: null });
    setCallerInfo(null);
    setLatestCallers([]);
    setError(null);
    setLoading(false);
  }, [open]);

  // Reload likes when wallet changes
  useEffect(() => {
    if (open && contract) {
      loadTokenLikes();
      loadTokenReactions();
    }
  }, [wallet, open, contract]);

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
                    src={callerInfo.pfp || undefined}
                    alt={callerInfo.publicKey.slice(0, 2).toUpperCase()}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      cursor: 'pointer',
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
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
                          src={caller.pfp || undefined} 
                          alt={caller.caller.slice(0, 2).toUpperCase()}
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            cursor: 'pointer',
                            backgroundColor: '#1976d2',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography className="dialog-title">{t('token_metadata')}</Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0'
              }}>
                {/* Likes */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>
                    {tokenReactions.likes}
                  </Typography>
                  {wallet && (
                    <IconButton 
                      size="small" 
                      onClick={handleToggleTokenReactionLike} 
                      aria-label={tokenReactions.userReaction === 'LIKE' ? t('unlike_token') : t('like_token')}
                      sx={{ 
                        padding: '4px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0,0,0,0.04)' 
                        }
                      }}
                    >
                      {tokenReactions.userReaction === 'LIKE' ? (
                        <ThumbUpIcon fontSize="small" sx={{ color: '#4caf50' }} />
                      ) : (
                        <ThumbUpOutlinedIcon fontSize="small" sx={{ color: '#666' }} />
                      )}
                    </IconButton>
                  )}
                </Box>
                
                {/* Dislikes */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>
                    {tokenReactions.dislikes}
                  </Typography>
                  {wallet && (
                    <IconButton 
                      size="small" 
                      onClick={handleToggleTokenReactionDislike} 
                      aria-label={tokenReactions.userReaction === 'DISLIKE' ? t('undislike_token') : t('dislike_token')}
                      sx={{ 
                        padding: '4px',
                        '&:hover': { 
                          backgroundColor: 'rgba(0,0,0,0.04)' 
                        }
                      }}
                    >
                      {tokenReactions.userReaction === 'DISLIKE' ? (
                        <ThumbDownIcon fontSize="small" sx={{ color: '#f44336' }} />
                      ) : (
                        <ThumbDownOutlinedIcon fontSize="small" sx={{ color: '#666' }} />
                      )}
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
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
          
          {/* Enhanced NFT Metadata with CoinGecko Backup */}
          {enhancedToken?.collectionData && (
            <Box className="collection-data-panel">
              <Typography className="dialog-title">{t('nft_collection_data')}</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                  {t('coingecko_backup')}
                </Typography>
                <Box className="collection-data-grid">
                  {enhancedToken.collectionData.floorPrice && (
                    <Box className="collection-data-item">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4169e1' }}>
                        {t('collection_floor_price')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        {enhancedToken.collectionData.floorPrice}
                      </Typography>
                    </Box>
                  )}
                  {enhancedToken.collectionData.marketCap && (
                    <Box className="collection-data-item">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4169e1' }}>
                        {t('collection_market_cap')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        {enhancedToken.collectionData.marketCap}
                      </Typography>
                    </Box>
                  )}
                  {enhancedToken.collectionData.volume24h && (
                    <Box className="collection-data-item">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4169e1' }}>
                        {t('collection_volume_24h')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        {enhancedToken.collectionData.volume24h}
                      </Typography>
                    </Box>
                  )}
                  {enhancedToken.collectionData.totalSupply && (
                    <Box className="collection-data-item">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4169e1' }}>
                        {t('collection_total_supply')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        {enhancedToken.collectionData.totalSupply}
                      </Typography>
                    </Box>
                  )}
                  {enhancedToken.collectionData.uniqueHolders && (
                    <Box className="collection-data-item">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4169e1' }}>
                        {t('collection_unique_holders')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        {enhancedToken.collectionData.uniqueHolders}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
          
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
              
              {/* Token Holders Section */}
              <Box sx={{ mt: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 1, 
                    backgroundColor: '#fafafa', 
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f0f0f0' }
                  }}
                  onClick={handleHoldersToggle}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {t('top_holders')} (Top 10)
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {holdersExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                
                <Collapse in={holdersExpanded}>
                  <Box sx={{ mt: 1, border: '1px solid #ddd', borderRadius: 0.5, backgroundColor: '#fff' }}>
                    {holdersLoading ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {t('loading')}...
                        </Typography>
                      </Box>
                    ) : tokenHolders.length > 0 ? (
                      <List dense sx={{ py: 0 }}>
                        {tokenHolders.map((holder, index) => (
                          <React.Fragment key={holder.address}>
                            <ListItem 
                              sx={{ 
                                py: 1, 
                                px: 2,
                                '&:hover': { backgroundColor: '#f9f9f9' }
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box
                                    className="token-holder-row"
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: { xs: 'flex-start', sm: 'center' },
                                      flexDirection: { xs: 'column', sm: 'row' },
                                      gap: { xs: 0.5, sm: 0 }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                        #{index + 1}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ 
                                          fontFamily: 'monospace', 
                                          cursor: 'pointer',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => copyToClipboard(holder.address)}
                                        title="Click to copy"
                                      >
                                        {formatAddress(holder.address)}
                                      </Typography>
                                    </Box>
                                    <Box
                                      className="holder-metrics"
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mt: { xs: 0.5, sm: 0 },
                                        alignSelf: { xs: 'stretch', sm: 'auto' }
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {holder.percentage.toFixed(2)}%
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                        ({formatTokenAmount(holder.uiAmountString)})
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < tokenHolders.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          {t('no_holders_data')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
              
              {/* Liquidity Pools Section */}
              <Box sx={{ mt: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 1, 
                    backgroundColor: '#fafafa', 
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f0f0f0' }
                  }}
                  onClick={handlePoolsToggle}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PoolIcon fontSize="small" />
                    <Typography variant="body2" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {t('liquidity_pools')} (Top 5)
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {poolsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                
                <Collapse in={poolsExpanded}>
                  <Box sx={{ mt: 1, border: '1px solid #ddd', borderRadius: 0.5, backgroundColor: '#fff' }}>
                    {poolsLoading ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {t('loading')}...
                        </Typography>
                      </Box>
                    ) : liquidityPools.length > 0 ? (
                      <List dense sx={{ py: 0 }}>
                        {liquidityPools.map((pool, index) => (
                          <React.Fragment key={pool.id}>
                            <ListItem 
                              sx={{ 
                                py: 1.5, 
                                px: 2,
                                '&:hover': { backgroundColor: '#f9f9f9' }
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {pool.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        color: pool.priceChange24h.startsWith('-') ? '#f44336' : '#4caf50',
                                        fontWeight: 'bold',
                                        backgroundColor: pool.priceChange24h.startsWith('-') ? '#ffebee' : '#e8f5e8',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        {pool.priceChange24h}%
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                        DEX: {pool.dex}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                        Txns: {pool.transactions24h}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                        Reserve: {pool.reserve}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#666' }}>
                                        Volume 24h: {pool.volume24h}
                                      </Typography>
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' },
                                        color: '#999',
                                        fontSize: '0.75rem'
                                      }}
                                      onClick={() => copyToClipboard(pool.address)}
                                      title="Click to copy pool address"
                                    >
                                      {formatAddress(pool.address)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < liquidityPools.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          {t('no_pools_data')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
              
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
