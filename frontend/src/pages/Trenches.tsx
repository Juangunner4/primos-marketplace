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
import {
  getNFTByTokenAddress,
  fetchCollectionNFTsForOwner,
} from '../services/helius';
import { fetchSimpleTokenPrice } from '../services/coingecko';
import ContractPanel from '../components/ContractPanel';
import MessageModal from '../components/MessageModal';
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

  console.log('Trenches component rendering', { 
    publicKey: publicKey?.toBase58(), 
    isHolder, 
    dataContracts: data.contracts.length,
    dataUsers: data.users.length,
    loading,
    connectionPresent: !!connection
  });

  const canSubmit = !!publicKey && isHolder;

  const { counts, latestUsers } = useMemo(() => {
    const counts: Record<string, number> = {};
    const latestUsers: Record<string, TrenchUser | undefined> = {};
    data.users.forEach((u) => {
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
    try {
      const res = await api.get<TrenchData>('/api/trench');

      // Preload users so counts render immediately
      setData({ 
        contracts: [], 
        users: res.data.users || [], 
        latestCallers: res.data.latestCallers || {} 
      });
      if (showSpinner) setLoading(false);

      // Stream contracts one by one
      const contracts = res.data.contracts || [];
      contracts.forEach(async (c) => {
        try {
          setData((prev) => ({ ...prev, contracts: [...prev.contracts, c] }));
          
          const nft = await getNFTByTokenAddress(c.contract);
          if (nft?.image) {
            setData((prev) => ({
              ...prev,
              contracts: prev.contracts.map((cc) =>
                cc.contract === c.contract ? { ...cc, image: nft.image } : cc
              ),
            }));
          }
          
          // Fetch current market cap
          let marketCap: number | undefined;
          let priceChange: number | undefined;
          try {
            if (/^0x[0-9a-fA-F]{40}$/.test(c.contract)) {
              const tokenData = await fetchSimpleTokenPrice(c.contract, 'ethereum');
              marketCap = tokenData?.usd_market_cap;
              priceChange = tokenData?.usd_24h_change;
            } else {
              const tokenData = await fetchSimpleTokenPrice(c.contract, 'solana');
              marketCap = tokenData?.usd_market_cap;
              priceChange = tokenData?.usd_24h_change;
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
            console.warn('Failed to fetch market data for contract:', c.contract, err);
          }
        } catch (err) {
          console.warn('Failed to process contract:', c.contract, err);
        }
      });

      // Fetch user profile images gradually
      const users = res.data.users || [];
      users.forEach(async (u) => {
        let image = '';
        try {
          const pfpAddr = u.pfp?.replace(/"/g, '');
          if (pfpAddr) {
            const nft = await getNFTByTokenAddress(pfpAddr);
            image = nft?.image || '';
          } else if (PRIMO_COLLECTION) {
            const nfts = await fetchCollectionNFTsForOwner(
              u.publicKey,
              PRIMO_COLLECTION
            );
            image = nfts[0]?.image || '';
          }
        } catch (err) {
          console.warn('Failed to fetch PFP for user:', u.publicKey, err);
        }
        setData((prev) => ({
          ...prev,
          users: prev.users.map((uu) =>
            uu.publicKey === u.publicKey ? { ...uu, pfp: image } : uu
          ),
        }));
      });
    } catch (err) {
      console.error('Failed to load trench data:', err);
      setMessage({ text: t('failed_to_load_data'), type: 'error' });
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Trenches useEffect triggered');
    try {
      load();
    } catch (error) {
      console.error('Error in Trenches useEffect:', error);
      setMessage({ text: t('initialization_error'), type: 'error' });
    }
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
              console.warn('Failed to fetch market cap for token:', e);
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

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment3_title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('experiment3_desc')}
      </Typography>
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 1, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
          <Typography variant="caption">
            Debug: publicKey={publicKey?.toBase58()}, isHolder={String(isHolder)}, 
            contracts={data.contracts.length}, users={data.users.length}, loading={String(loading)}
          </Typography>
        </Box>
      )}
      
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
                      src={lastUser.pfp || undefined}
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

