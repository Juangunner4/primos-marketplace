import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { fetchTrenchData, submitTrenchContract, TrenchData } from '../services/trench';
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

  const canSubmit = !!publicKey && isHolder;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    data.users.forEach((u) => {
      u.contracts.forEach((c) => {
        map[c] = (map[c] || 0) + 1;
      });
    });
    return map;
  }, [data]);

  const load = async () => {
    const res = await fetchTrenchData();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!input || !publicKey) return;
    let valid = false;
    let marketCap: number | undefined;
    
    if (/^0x[0-9a-fA-F]{40}$/.test(input)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${input}`);
        if (res.ok) {
          const data = await res.json();
          valid = true;
          marketCap = data.market_data?.market_cap?.usd;
        }
      } catch {}
    }
    
    if (!valid) {
      try {
        const addr = new PublicKey(input);
        const info = await connection.getAccountInfo(addr);
        if (info) {
          valid = true;
          // Try to get Solana token market cap from CoinGecko
          try {
            const response = await fetch(
              `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${input}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
            );
            if (response.ok) {
              const data = await response.json();
              const tokenData = data[input.toLowerCase()];
              if (tokenData?.usd_market_cap) {
                marketCap = tokenData.usd_market_cap;
              }
            }
          } catch (e) {
            console.warn('Failed to fetch market cap for token:', e);
          }
        }
      } catch {}
    }
    
    if (!valid) {
      setMessage({ text: t('contract_not_onchain'), type: 'error' });
      return;
    }
    
    await submitTrenchContract(publicKey.toBase58(), input, 'model1', marketCap);
    setInput('');
    load();
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
            disabled={!input}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': { backgroundColor: '#333' },
              '&:disabled': { backgroundColor: '#ccc', color: '#666' },
            }}
          >
            {t('add_contract')}
          </Button>
        </Box>
      )}
      <Box className="bubble-map">
        {data.contracts.map((c) => {
          const firstUser = data.users.find((u) => u.publicKey === c.firstCaller);
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
              {firstUser && (
                <Avatar
                  src={firstUser.pfp || undefined}
                  alt={firstUser.publicKey}
                  className="caller-tag"
                />
              )}
              <Box className="count-tag">{userCount}</Box>
            </button>
          );
        })}
      </Box>
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

