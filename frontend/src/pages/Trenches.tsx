import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import {
  submitTrenchContract,
  TrenchData,
  TrenchUser,
} from '../services/trench';
import api from '../utils/api';
import { getNFTByTokenAddress } from '../services/helius';
import { resolvePfpImage } from '../services/user';
import { fetchSimpleTokenPrice } from '../services/coingecko';
import ContractPanel from '../components/ContractPanel';
import MessageModal from '../components/MessageModal';
import AdminDeveloperConsole from '../components/AdminDeveloperConsole';
import { AppMessage } from '../types';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import './Trenches.css';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION;

if (!PRIMO_COLLECTION) {
  console.error('REACT_APP_PRIMOS_COLLECTION environment variable is not set');
}

// Format market cap into readable string
const formatCap = (cap: number) => {
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  if (cap >= 1e3) return `$${(cap / 1e3).toFixed(1)}k`;
  return `$${cap.toFixed(0)}`;
};

// Format price change percentage
const formatPriceChange = (change: number) => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Get price change CSS class
const getPriceChangeClass = (change: number) => {
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
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
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

  useEffect(() => {
    setDebugInfo(prev => ({ ...prev, renderAttempted: true }));
    
    const initializeComponent = async () => {
      try {
        await load();
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
    setAdding(true);
    let valid = false;
    let marketCap: number | undefined;

    if (/^0x[0-9a-fA-F]{40}$/.test(contract)) {
      try {
        const data = await fetchSimpleTokenPrice(contract, 'ethereum');
        if (data) {
          valid = true;
          marketCap = data.usd_market_cap;
        }
      } catch {}
    }

    if (!valid) {
      try {
        const addr = new PublicKey(contract);
        if (connection) {
          const info = await connection.getAccountInfo(addr);
          if (info) {
            valid = true;
            // Try to get Solana token market cap from CoinGecko via backend proxy
            try {
              const tokenData = await fetchSimpleTokenPrice(contract, 'solana');
              if (tokenData?.usd_market_cap) {
                marketCap = tokenData.usd_market_cap;
              }
            } catch (e) {
            }
          }
        }
      } catch {}
    }

    if (!valid) {
      setMessage({ text: t('contract_not_onchain'), type: 'error' });
      setAdding(false);
      return;
    }

    try {
      await submitTrenchContract(publicKey.toBase58(), contract, 'model1', marketCap);
      setInput('');
      await load(false);
    } catch (e: any) {
      const errorMsg = e?.response?.data;
      if (typeof errorMsg === 'string' && errorMsg.includes('Contract already added')) {
        setInput('');
        const userCount = counts[contract] || 0;
        setOpenContract(contract);
        setOpenContractUserCount(userCount);
      } else {
        setMessage({ text: t('contract_already_added'), type: 'error' });
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
      const response = await api.post('/api/trench/discover-primo-tokens');
      
      setMessage({ 
        text: `Token discovery complete: ${response.data.message}`, 
        type: response.data.success ? 'success' : 'error'
      });
      
      // Reload trenches data to show new tokens
      await load(false);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.response?.data || 'Failed to discover tokens';
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
        <Button
          variant="outlined"
          onClick={handleDiscoverTokens}
          disabled={discoveringTokens}
          sx={{
            borderColor: '#000',
            color: '#000',
            '&:hover': { borderColor: '#333', backgroundColor: '#f5f5f5' },
            '&:disabled': { borderColor: '#ccc', color: '#666' },
          }}
        >
          {discoveringTokens ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Discover Primo Tokens'
          )}
        </Button>
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
                  {c.priceChange24h !== undefined && (
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
      <ContractPanel 
        contract={openContract} 
        open={openContract !== null} 
        onClose={() => {
          setOpenContract(null);
          setOpenContractUserCount(0);
        }} 
        userCount={openContractUserCount}
      />
      <MessageModal open={message !== null} message={message} onClose={() => setMessage(null)} />
    </Box>
  );
};

export default Trenches;

