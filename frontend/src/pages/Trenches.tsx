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
  fetchTrenchData,
  submitTrenchContract,
  TrenchData,
  TrenchUser,
} from '../services/trench';
import { fetchSimpleTokenPrice } from '../services/coingecko';
import ContractPanel from '../components/ContractPanel';
import MessageModal from '../components/MessageModal';
import { AppMessage } from '../types';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import './Trenches.css';

const Trenches: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { isHolder } = usePrimoHolder();
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [data, setData] = useState<TrenchData>({ contracts: [], users: [] });
  const [openContract, setOpenContract] = useState<string | null>(null);
  const [openContractUserCount, setOpenContractUserCount] = useState<number>(0);
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

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
      const res = await fetchTrenchData();
      setData(res);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
          {data.contracts.map((c) => {
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
                <Box className="count-tag">{userCount}</Box>
              </button>
            );
          })}
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

