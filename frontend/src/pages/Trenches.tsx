import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  submitTrenchContract,
  TrenchData,
  TrenchUser,
} from '../services/trench';
import api from '../utils/api';
import { getNFTByTokenAddress } from '../services/helius';
import type { HeliusFungibleToken } from '../services/helius';
import { resolvePfpImage } from '../services/user';
import { fetchSimpleTokenPrice } from '../services/coingecko';
import ContractPanel from '../components/ContractPanel';
import MessageModal from '../components/MessageModal';
import AdminDeveloperConsole from '../components/AdminDeveloperConsole';
import { AppMessage } from '../types';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import './Trenches.css';
import { PrimoToken, fetchPrimoTokensOnChain } from '../services/primoTokens';

interface HolderInfo {
  publicKey: string;
  pfp?: string;
  domain?: string;
  isPrimo: boolean;
}

interface TradingViewChart {
  exchange: string;
  pair: string;
  tradingViewSymbol: string;
  chartUrl: string;
}

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION;

if (!PRIMO_COLLECTION) {
  console.error('REACT_APP_PRIMOS_COLLECTION environment variable is not set');
}

// Format market cap into readable string
const formatCap = (cap: number | null | undefined) => {
  if (cap == null || isNaN(cap)) return 'N/A';
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  if (cap >= 1e3) return `$${(cap / 1e3).toFixed(1)}k`;
  return `$${cap.toFixed(0)}`;
};

// Format price change percentage
const formatPriceChange = (change: number | null | undefined) => {
  if (change == null || isNaN(change)) return 'N/A';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Get price change CSS class
const getPriceChangeClass = (change: number | null | undefined) => {
  if (change == null || isNaN(change)) return 'price-change-tag neutral';
  if (change > 0) return 'price-change-tag positive';
  if (change < 0) return 'price-change-tag negative';
  return 'price-change-tag neutral';
};

// Helper function to safely get PFP image URL
const getSafePfpUrl = (pfp: string | undefined | null): string | undefined => {
  if (!pfp || pfp === 'undefined' || pfp === 'null') {
    return undefined;
  }
  
  // Check if it's already a valid image URL
  if (pfp.startsWith('http://') || pfp.startsWith('https://') || pfp.startsWith('data:')) {
    return pfp;
  }
  
  // If it looks like a token address (not an image URL), don't use it
  if (pfp.length > 30 && !pfp.includes('.') && !pfp.includes('/')) {
    return undefined;
  }
  
  return pfp;
};

const Trenches: React.FC = () => {
  // Always call hooks unconditionally
  const wallet = useWallet();
  const { connection } = useConnection();
  const primoContext = usePrimoHolder();
  const { t } = useTranslation();

  // Extract values with fallbacks
  const publicKey = wallet.publicKey;
  const isHolder = primoContext?.isHolder || false;

  const [input, setInput] = useState('');
  const [data, setData] = useState<TrenchData>({ contracts: [], users: [], latestCallers: {} });
  const [openContract, setOpenContract] = useState<string | null>(null);
  const [openContractUserCount, setOpenContractUserCount] = useState<number>(0);
  const [openPrimoToken, setOpenPrimoToken] = useState<string | null>(null);
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [primoTokens, setPrimoTokens] = useState<PrimoToken[]>([]);
  const [loadingPrimoTokens, setLoadingPrimoTokens] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    apiCallAttempted: false,
    apiCallSuccess: false,
    apiCallError: null as string | null,
    contractsLoaded: 0,
    usersLoaded: 0,
    renderAttempted: false,
    lastError: null as Error | null,
    networkErrors: [] as { url: string; status?: number; message: string }[]
  });
  const [discoveringTokens, setDiscoveringTokens] = useState(false);

  const logNetworkError = (url: string, err: any) => {
    const status = err?.response?.status;
    const message = err?.message || 'Unknown error';
    // console.error(`🌐 Network error for ${url}:`, { status, message });
    setDebugInfo((prev) => ({
      ...prev,
      networkErrors: [...prev.networkErrors, { url, status, message }],
    }));
  };


  const canSubmit = !!publicKey && isHolder;

  const { counts, latestUsers } = useMemo(() => {
    const counts: Record<string, number> = {};
    const latestUsers: Record<string, TrenchUser | undefined> = {};

    // Safeguard against malformed API responses
    const usersArray = Array.isArray(data.users) ? data.users : [];

    usersArray.forEach((u) => {
      const lastAt = u.lastSubmittedAt || 0;
      u.contracts.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
        const prev = latestUsers[c];
        if (!prev || lastAt > (prev.lastSubmittedAt || 0)) {
          latestUsers[c] = u;
        }
      });
    });
    return { counts, latestUsers };
  }, [data]);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      apiCallAttempted: true,
      apiCallSuccess: false,
      apiCallError: null
    }));

    try {
      const res = await api.get<TrenchData>('/api/trench');
      const resData = (res.data || {}) as Partial<TrenchData>;
      const contractsArr = Array.isArray(resData.contracts) ? resData.contracts : [];
      const usersArr = Array.isArray(resData.users) ? resData.users : [];
      const latestCallersObj =
        resData.latestCallers && typeof resData.latestCallers === 'object'
          ? resData.latestCallers
          : {};

      setDebugInfo(prev => ({
        ...prev,
        apiCallSuccess: true,
        contractsLoaded: contractsArr.length,
        usersLoaded: usersArr.length
      }));

      // Preload users so counts render immediately
      setData({
        contracts: [],
        users: usersArr,
        latestCallers: latestCallersObj
      });
      if (showSpinner) setLoading(false);

      // Stream contracts one by one
      contractsArr.forEach(async (c) => {
        // Always add contract bubble
        setData((prev) => ({ ...prev, contracts: [...prev.contracts, c] }));

        try {
          const nft = await getNFTByTokenAddress(c.contract);
          if (nft?.image) {
            setData((prev) => ({
              ...prev,
              contracts: prev.contracts.map((cc) =>
                cc.contract === c.contract ? { ...cc, image: nft.image } : cc
              ),
            }));
          } else if (!nft) {
            logNetworkError(`getNFTByTokenAddress(${c.contract})`, new Error('No NFT data'));
          }
        } catch (err) {
          logNetworkError(`getNFTByTokenAddress(${c.contract})`, err);
        }

        // Fetch current market cap
        let marketCap: number | undefined;
        let priceChange: number | undefined;
        try {
          if (/^0x[0-9a-fA-F]{40}$/.test(c.contract)) {
            const tokenData = await fetchSimpleTokenPrice(c.contract, 'ethereum');
            if (tokenData) {
              marketCap = tokenData.usd_market_cap;
              priceChange = tokenData.usd_24h_change;
            } else {
              logNetworkError(`fetchSimpleTokenPrice(${c.contract})`, new Error('No token data'));
            }
          } else {
            const tokenData = await fetchSimpleTokenPrice(c.contract, 'solana');
            if (tokenData) {
              marketCap = tokenData.usd_market_cap;
              priceChange = tokenData.usd_24h_change;
            } else {
              logNetworkError(`fetchSimpleTokenPrice(${c.contract})`, new Error('No token data'));
            }
          }

          if (marketCap || priceChange !== undefined) {
            setData((prev) => ({
              ...prev,
              contracts: prev.contracts.map((cc) =>
                cc.contract === c.contract ? { ...cc, marketCap, priceChange24h: priceChange } : cc
              ),
            }));
          }
        } catch (err) {
          logNetworkError(`fetchSimpleTokenPrice(${c.contract})`, err);
        }
      });

      // Fetch user profile images gradually using unified resolver
      usersArr.forEach(async (u) => {
        try {
          const image = await resolvePfpImage(u.pfp, u.publicKey);
          if (!image) {
            logNetworkError(`userPfp(${u.publicKey})`, new Error('No image found'));
          }
          setData((prev) => ({
            ...prev,
            users: prev.users.map((uu) =>
              uu.publicKey === u.publicKey ? { ...uu, pfp: image } : uu
            ),
          }));
        } catch (err) {
          logNetworkError(`userPfp(${u.publicKey})`, err);
        }
      });
    } catch (err) {
      logNetworkError('/api/trench', err);
      
      // Enhanced error logging
      const errorDetails = {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'UnknownError',
        isNetworkError: err instanceof Error && (
          err.message.includes('ECONNREFUSED') || 
          err.message.includes('Network Error') ||
          err.message.includes('fetch')
        )
      };
      
      
      setDebugInfo(prev => ({
        ...prev,
        apiCallError: errorDetails.message,
        lastError: err instanceof Error ? err : new Error(String(err))
      }));
      
      setMessage({ text: t('failed_to_load_data'), type: 'error' });
      if (showSpinner) setLoading(false);
    }
  };

  const loadPrimoTokens = async () => {
    setLoadingPrimoTokens(true);
    console.log('Starting Primo token discovery (separate from Trenches AI contracts)...');
    
    try {
      const res = await api.get<PrimoToken[]>('/api/primo-tokens');
      const tokens = Array.isArray(res.data) ? res.data : [];
      
      console.log(`Loaded ${tokens.length} Primo tokens, enriching with metadata...`);
      
      // Enrich tokens with metadata if not already present
      const enriched = await Promise.all(
        tokens.map(async (t, index) => {
          try {
            console.log(`Enriching token ${index + 1}/${tokens.length}: ${t.contract}`);
            
            let image = t.image;
            let name = t.name;
            let symbol = t.symbol;
            
            // Only fetch metadata if not present
            if (!image || !name || !symbol) {
              const meta = await getNFTByTokenAddress(t.contract);
              image = image || meta?.image;
              name = name || meta?.name;
              symbol = symbol || meta?.symbol;
            }
            
            return {
              id: t.contract,
              contract: t.contract,
              holderCount: t.holderCount,
              holders: t.holders,
              holderDetails: t.holderDetails,
              tradingViewCharts: t.tradingViewCharts,
              name,
              symbol,
              image,
              marketCap: t.marketCap,
              priceChange24h: t.priceChange24h,
            } as HeliusFungibleToken & PrimoToken;
          } catch (err) {
            logNetworkError(`getNFTByTokenAddress(${t.contract})`, err);
            return {
              id: t.contract,
              contract: t.contract,
              holderCount: t.holderCount,
              holders: t.holders,
              holderDetails: t.holderDetails,
              tradingViewCharts: t.tradingViewCharts,
              name: t.name,
              symbol: t.symbol,
              image: t.image,
              marketCap: t.marketCap,
              priceChange24h: t.priceChange24h,
            } as HeliusFungibleToken & PrimoToken;
          }
        })
      );
      
      console.log(`Successfully enriched ${enriched.length} Primo tokens with metadata`);
      setPrimoTokens(enriched);
    } catch (err) {
      console.error('Failed to load Primo tokens:', err);
      logNetworkError('/api/primo-tokens', err);

      // Fallback to on-chain discovery via the frontend
      try {
        const onChainTokens = await fetchPrimoTokensOnChain();
        setPrimoTokens(onChainTokens);
      } catch (chainErr) {
        console.error('On-chain Primo token discovery failed:', chainErr);
        logNetworkError('fetchPrimoTokensOnChain', chainErr);
      }
    } finally {
      setLoadingPrimoTokens(false);
    }
  };

  useEffect(() => {
    setDebugInfo(prev => ({ ...prev, renderAttempted: true }));
    
    const initializeComponent = async () => {
      try {
        await load();
        await loadPrimoTokens();
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          lastError: error instanceof Error ? error : new Error(String(error))
        }));
        setMessage({ text: t('initialization_error'), type: 'error' });
      }
    };

    initializeComponent();
  }, []);

  const handleAdd = async () => {
    const contract = input.trim();
    if (!contract || !publicKey) return;
    
    console.log('Adding contract:', contract, 'for publicKey:', publicKey.toBase58());
    setAdding(true);
    let valid = false;
    let marketCap: number | undefined;
    let tokenMetadata: any = null;

    // Check if it's an Ethereum contract
    if (/^0x[0-9a-fA-F]{40}$/.test(contract)) {
      console.log('Detected Ethereum contract format');
      try {
        const data = await fetchSimpleTokenPrice(contract, 'ethereum');
        if (data) {
          valid = true;
          marketCap = data.usd_market_cap;
          console.log('Ethereum contract validated, market cap:', marketCap);
        }
      } catch (e) {
        console.warn('Failed to validate Ethereum contract:', e);
      }
    }

    // Check if it's a Solana contract
    if (!valid) {
      console.log('Checking Solana contract format');
      try {
        const addr = new PublicKey(contract);
        if (connection) {
          const info = await connection.getAccountInfo(addr);
          if (info) {
            valid = true;
            console.log('Solana contract validated');
            
            // Fetch token metadata from Helius
            try {
              const nft = await getNFTByTokenAddress(contract);
              if (nft) {
                tokenMetadata = {
                  name: nft.name,
                  symbol: nft.symbol,
                  image: nft.image,
                  description: nft.description
                };
                console.log('Token metadata fetched:', tokenMetadata);
              }
            } catch (e) {
              console.warn('Failed to fetch token metadata:', e);
            }
            
            // Try to get Solana token market cap from CoinGecko via backend proxy
            try {
              const tokenData = await fetchSimpleTokenPrice(contract, 'solana');
              if (tokenData?.usd_market_cap) {
                marketCap = tokenData.usd_market_cap;
                console.log('Solana market cap fetched:', marketCap);
              }
            } catch (e) {
              console.warn('Failed to fetch market cap:', e);
            }
          }
        } else {
          console.warn('No Solana connection available');
        }
      } catch (e) {
        console.warn('Invalid Solana contract address:', e);
      }
    }

    if (!valid) {
      console.log('Contract validation failed');
      setMessage({ text: t('contract_not_onchain'), type: 'error' });
      setAdding(false);
      return;
    }

    console.log('Submitting contract to backend...');
    try {
      await submitTrenchContract(
        publicKey.toBase58(), 
        contract, 
        'model1', 
        marketCap,
        undefined, // domain
        tokenMetadata // Pass metadata
      );
      console.log('Contract submitted successfully');
      setInput('');
      await load(false);
    } catch (e: any) {
      console.error('Error adding contract:', e);
      const errorMsg = e?.response?.data;
      
      if (typeof errorMsg === 'string' && errorMsg.includes('Contract already added')) {
        setInput('');
        const userCount = counts[contract] || 0;
        setOpenContract(contract);
        setOpenContractUserCount(userCount);
      } else {
        // Handle other types of errors - show more detailed error information
        let errorText = t('error_adding_contract');
        
        if (typeof errorMsg === 'string') {
          errorText = errorMsg;
        } else if (e?.response?.data?.message) {
          errorText = e.response.data.message;
        } else if (e?.message) {
          errorText = e.message;
        } else if (e?.response?.status === 400) {
          // Check for specific 400 error cases
          if (!errorMsg || errorMsg === '') {
            // Empty 400 response usually indicates rate limiting
            errorText = t('rate_limit_error');
          } else {
            errorText = 'Bad request: Please check that the contract address is valid.';
          }
        } else if (e?.response?.status) {
          errorText = `HTTP ${e.response.status}: ${e.response.statusText || 'Unknown error'}`;
        }
        
        setMessage({ text: errorText, type: 'error' });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCopy = (contract: string) => {
    navigator.clipboard.writeText(contract);
    setMessage({ text: t('contract_copied'), type: 'success' });
  };

  const handleDiscoverTokens = async () => {
    setDiscoveringTokens(true);
    try {
      const tokens = await fetchPrimoTokensOnChain();
      setPrimoTokens(tokens);
      setMessage({ text: 'Token discovery complete', type: 'success' });
      // Reload trenches data to show new tokens
      await load(false);
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to discover tokens';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setDiscoveringTokens(false);
    }
  };


  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment3_title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('experiment3_desc')}
      </Typography>
      
      {/* Admin Developer Console - Floating Button */}
      <AdminDeveloperConsole
        debugInfo={debugInfo}
        componentName="Trenches"
        additionalData={{
          dataContracts: data.contracts.length,
          dataUsers: data.users.length,
          loading,
          adding,
          isHolder,
          canSubmit,
          connectionPresent: !!connection,
          environmentVars: {
            primoCollection: !!PRIMO_COLLECTION,
            nodeEnv: process.env.NODE_ENV,
            backendUrl: process.env.REACT_APP_BACKEND_URL
          }
        }}
      />
      
      {/* Sentiment Explanation */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 1, 
        border: '1px solid #ddd',
        maxWidth: '800px',
        margin: '0 auto 1.5rem auto'
      }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrackChangesIcon fontSize="small" />
          {t('how_sentiment_works')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
          {t('sentiment_explanation')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          • {t('sentiment_bubble_size')}<br/>
          • {t('sentiment_community_signal')}<br/>
          • {t('sentiment_first_caller')}
        </Typography>
      </Box>
      
      {/* Add Contract Section - Only for Primo Holders */}
      {canSubmit && (
        <Box className="input-row" sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('enter_contract')}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!input || adding}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': { backgroundColor: '#333' },
              '&:disabled': { backgroundColor: '#ccc', color: '#666' },
            }}
          >
            {adding ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('add_contract')
            )}
          </Button>
        </Box>
      )}
      
      {/* Token Discovery Section - Public Access */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('discover_primo_tokens')}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                • {t('discover_primo_tokens_scan')}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • {t('discover_primo_tokens_find')}
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <Button
            variant="outlined"
            onClick={handleDiscoverTokens}
            disabled={discoveringTokens}
            startIcon={discoveringTokens ? <CircularProgress size={20} /> : <RefreshIcon />}
            sx={{
              borderColor: '#000',
              color: '#000',
              '&:hover': { borderColor: '#333', backgroundColor: '#f5f5f5' },
              '&:disabled': { borderColor: '#ccc', color: '#666' },
            }}
          >
            {discoveringTokens ? 'Discovering...' : t('discover_primo_tokens')}
          </Button>
        </Tooltip>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box className="bubble-map">
          {data.contracts.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, color: '#666' }}>
              {t('no_contracts_yet') || 'No contracts to display yet.'}
            </Typography>
          ) : (
            data.contracts.map((c) => {
              const lastUser = latestUsers[c.contract];
              const userCount = counts[c.contract] || 1;
              const size = Math.max(40, Math.min(100, 40 + userCount * 10));
              return (
                <button
                  key={c.contract}
                  className="bubble"
                  aria-label={c.contract}
                  title={c.contract}
                  style={{
                    width: size,
                    height: size,
                    backgroundImage: c.image ? `url(${c.image})` : undefined,
                  }}
                  onClick={() => {
                    setOpenContract(c.contract);
                    setOpenContractUserCount(userCount);
                  }}
                  onDoubleClick={() => handleCopy(c.contract)}
                >
                  {c.model && (
                    <Box className="model-tag">
                      {c.model === 'model1' ? 'm01' : c.model}
                    </Box>
                  )}
                  {lastUser && (
                    <Avatar
                      src={getSafePfpUrl(lastUser.pfp)}
                      alt={lastUser.publicKey}
                      className="caller-tag"
                    />
                  )}
                  {c.marketCap && (
                    <Box className="market-cap-tag">
                      {formatCap(c.marketCap)}
                    </Box>
                  )}
                  {c.priceChange24h !== undefined && c.priceChange24h !== null && (
                    <Box className={getPriceChangeClass(c.priceChange24h)}>
                      {formatPriceChange(c.priceChange24h)}
                    </Box>
                  )}
                  <Box className="count-tag">{userCount}</Box>
                </button>
              );
            })
          )}
        </Box>
      )}
      {loadingPrimoTokens ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, p: 3 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
            Discovering Primo Tokens
          </Typography>
          <Typography variant="body2" sx={{ 
            textAlign: 'center', 
            color: 'text.secondary',
            maxWidth: 400,
            lineHeight: 1.4 
          }}>
            Scanning Primo wallets for tokens with enhanced metadata from Jupiter, CoinGecko, and Helius APIs.
            Loading holder profile pictures and discovering TradingView charts for CEX-listed tokens.
            This may take a moment as we fetch comprehensive token and holder data...
          </Typography>
        </Box>
      ) : primoTokens.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {t('tokens_held_by_primos')}
              <Box sx={{ 
                px: 1.5, 
                py: 0.5, 
                backgroundColor: 'primary.main', 
                color: 'white', 
                borderRadius: 1, 
                fontSize: '0.75rem' 
              }}>
                {primoTokens.length} tokens
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary', 
              mb: 2,
              lineHeight: 1.5 
            }}>
              Tokens currently held by Primo members with enhanced market data. 
              Size indicates holder count, badges show performance metrics.
              This is separate from Trenches AI contracts.
            </Typography>
          </Box>
          <Box className="bubble-map">
            {primoTokens.filter(token => token && typeof token === 'object' && (token as any).contract).map((token) => {
              const tokenData = token as HeliusFungibleToken & PrimoToken;
              const holderCount = tokenData.holderCount || 1;
              const size = Math.max(80, Math.min(140, 80 + holderCount * 10));
              const hasMultipleHolders = holderCount > 1;

              return (
                <div
                  key={tokenData.id || tokenData.contract}
                  className="bubble"
                  aria-label={`${tokenData.name || tokenData.symbol || (tokenData.id && typeof tokenData.id === 'string' ? tokenData.id : tokenData.contract)} - ${holderCount} holder${holderCount === 1 ? '' : 's'}`}
                  title={`Token: ${tokenData.name || tokenData.symbol || (tokenData.id && typeof tokenData.id === 'string' ? tokenData.id : tokenData.contract)}
Contract: ${tokenData.contract}
Holders: ${holderCount} Primo${holderCount === 1 ? '' : 's'}
${tokenData.holderDetails && tokenData.holderDetails.length > 0 ?
  `Primo Holders: ${tokenData.holderDetails.slice(0, 3).map(h => {
    if (h && typeof h === 'object') {
      const safeHolder = h as any;
      const domain = safeHolder.domain && typeof safeHolder.domain === 'string' ? safeHolder.domain : '';
      const publicKey = safeHolder.publicKey && typeof safeHolder.publicKey === 'string' ? safeHolder.publicKey : '';
      return domain || publicKey.substring(0, 8) || 'Unknown';
    }
    return 'Unknown';
  }).join(', ')}${tokenData.holderDetails.length > 3 ? '...' : ''}` : 
  ''}
${tokenData.tradingViewCharts && tokenData.tradingViewCharts.length > 0 ?
  `Trading Charts: ${tokenData.tradingViewCharts.map(chart => `${chart.exchange}:${chart.pair}`).join(', ')}` :
  ''}
${tokenData.priceChange24h !== undefined && tokenData.priceChange24h !== null ? `24h Change: ${formatPriceChange(tokenData.priceChange24h)}` : ''}
${tokenData.marketCap ? `Market Cap: ${formatCap(tokenData.marketCap)}` : ''}

Click: View details | Right-click: Open TradingView chart | Double-click: Copy contract`}
                  style={{
                    width: size,
                    height: size,
                    backgroundImage: tokenData.image ? `url(${tokenData.image})` : undefined,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onClick={() => {
                    // If the token has TradingView charts, show them in addition to the contract panel
                    if (tokenData.tradingViewCharts && tokenData.tradingViewCharts.length > 0) {
                      // Log the available charts
                      console.log('TradingView charts available for', tokenData.symbol || tokenData.name, tokenData.tradingViewCharts);
                    }
                    setOpenPrimoToken(tokenData.contract);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (tokenData.tradingViewCharts && tokenData.tradingViewCharts.length > 0) {
                      // Open the first available TradingView chart
                      window.open(tokenData.tradingViewCharts[0].chartUrl, '_blank');
                      setMessage({ 
                        text: `Opening TradingView chart for ${tokenData.symbol || tokenData.name} on ${tokenData.tradingViewCharts[0].exchange}`, 
                        type: 'success' 
                      });
                    } else {
                      setMessage({ 
                        text: `No TradingView charts available for ${tokenData.symbol || tokenData.name}`, 
                        type: 'info' 
                      });
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(tokenData.contract);
                    setMessage({ text: t('contract_copied'), type: 'success' });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {!tokenData.image && (
                    <Box sx={{ 
                      color: '#fff', 
                      fontSize: size > 100 ? '14px' : '12px', 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      p: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}>
                      <span>{tokenData.symbol || tokenData.name || (tokenData.id && typeof tokenData.id === 'string' ? tokenData.id.substring(0, 6) : 'Unknown')}</span>
                      {tokenData.name && tokenData.symbol && (
                        <span style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                          {tokenData.name && typeof tokenData.name === 'string' && tokenData.name.length > 10 ? tokenData.name.substring(0, 10) + '...' : tokenData.name}
                        </span>
                      )}
                    </Box>
                  )}
                  
                  {/* TradingView chart indicator */}
                  {tokenData.tradingViewCharts && tokenData.tradingViewCharts.length > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      top: -5,
                      left: -5,
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      title: `${tokenData.tradingViewCharts.length} TradingView chart${tokenData.tradingViewCharts.length === 1 ? '' : 's'} available`
                    }}>
                      TV
                    </Box>
                  )}
                  
                  {/* Multi-holder indicator */}
                  {hasMultipleHolders && (
                    <Box sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#2196f3',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      {holderCount}
                    </Box>
                  )}
                  
                  {/* Market cap tag */}
                  {tokenData.marketCap && (
                    <Box className="market-cap-tag" sx={{
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}>
                      {formatCap(tokenData.marketCap)}
                    </Box>
                  )}
                  
                  {/* Price change tag */}
                  {tokenData.priceChange24h !== undefined && tokenData.priceChange24h !== null && (
                    <Box className={getPriceChangeClass(tokenData.priceChange24h)} sx={{
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}>
                      {formatPriceChange(tokenData.priceChange24h)}
                    </Box>
                  )}
                  
                  {/* Holder avatars - show first few holders as small avatars */}
                  {tokenData.holderDetails && tokenData.holderDetails.length > 1 && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 0.5,
                      maxWidth: size,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}>
                      {tokenData.holderDetails.slice(0, Math.min(5, tokenData.holderDetails.length)).map((holderInfo, index) => {
                        // Safely extract holder information
                        const safeHolderInfo = holderInfo && typeof holderInfo === 'object' ? holderInfo as any : {};
                        const publicKey = safeHolderInfo.publicKey && typeof safeHolderInfo.publicKey === 'string' 
                          ? safeHolderInfo.publicKey : `holder-${index}`;
                        const domain = safeHolderInfo.domain && typeof safeHolderInfo.domain === 'string' 
                          ? safeHolderInfo.domain : '';
                        const pfp = safeHolderInfo.pfp && typeof safeHolderInfo.pfp === 'string' 
                          ? safeHolderInfo.pfp : '';
                        
                        return (
                          <Avatar
                            key={`${publicKey}-${index}`}
                            src={getSafePfpUrl(pfp)}
                            alt={domain || publicKey}
                            sx={{ 
                              width: 20, 
                              height: 20,
                              border: '2px solid #fff',
                              fontSize: '10px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          />
                        );
                      })}
                      {tokenData.holderDetails.length > 5 && (
                        <Box sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: '#666',
                          color: '#fff',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}>
                          +{tokenData.holderDetails.length - 5}
                        </Box>
                      )}
                    </Box>
                  )}
                </div>
              );
            })}
          </Box>
        </Box>
      )}
      <ContractPanel
        contract={openContract}
        open={openContract !== null}
        onClose={() => {
          setOpenContract(null);
          setOpenContractUserCount(0);
        }}
        userCount={openContractUserCount}
      />
      <ContractPanel
        contract={openPrimoToken}
        open={openPrimoToken !== null}
        onClose={() => setOpenPrimoToken(null)}
        userCount={0} // Primo tokens don't need user count from Trenches
      />
      <MessageModal open={message !== null} message={message} onClose={() => setMessage(null)} />
    </Box>
  );
};

export default Trenches;

