import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
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
    if (/^0x[0-9a-fA-F]{40}$/.test(input)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${input}`);
        if (res.ok) valid = true;
      } catch {}
    }
    if (!valid) {
      try {
        const addr = new PublicKey(input);
        const info = await connection.getAccountInfo(addr);
        if (info) valid = true;
      } catch {}
    }
    if (!valid) {
      setMessage({ text: t('contract_not_onchain'), type: 'error' });
      return;
    }
    await submitTrenchContract(publicKey.toBase58(), input, 'model1');
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
              onClick={() => setOpenContract(c.contract)}
              onDoubleClick={() => handleCopy(c.contract)}
            >
              <Box className="meta-container">
                {c.model && <Box className="model-tag">{c.model}</Box>}
                {firstUser && (
                  <Avatar
                    src={firstUser.pfp || undefined}
                    alt={firstUser.publicKey}
                    className="caller-tag"
                    sx={{ width: 16, height: 16 }}
                  />
                )}
              </Box>
              <Box className="count-tag">{userCount}</Box>
            </button>
          );
        })}
      </Box>
      <ContractPanel contract={openContract} open={openContract !== null} onClose={() => setOpenContract(null)} />
      <MessageModal open={message !== null} message={message} onClose={() => setMessage(null)} />
    </Box>
  );
};

export default Trenches;

