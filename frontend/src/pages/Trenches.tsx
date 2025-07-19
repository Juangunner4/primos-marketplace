import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import './Trenches.css';

interface TrenchContract {
  contract: string;
  count: number;
}

interface TrenchUser {
  publicKey: string;
  pfp: string;
  count: number;
}

interface TrenchData {
  contracts: TrenchContract[];
  users: TrenchUser[];
}

const Trenches: React.FC = () => {
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [data, setData] = useState<TrenchData>({ contracts: [], users: [] });

  const load = async () => {
    const res = await api.get<TrenchData>('/api/trench');
    setData(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!input) return;
    await api.post('/api/trench', { contract: input }, {
      headers: { 'X-Public-Key': publicKey?.toBase58() },
    });
    setInput('');
    load();
  };

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment3_title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('experiment3_desc')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('enter_contract')}
          size="small"
        />
        <Button variant="contained" onClick={handleAdd} disabled={!input}>
          {t('add_contract')}
        </Button>
      </Box>
      <Box className="bubble-map">
        {data.contracts.map((c) => {
          const short =
            c.contract.length > 7
              ? `${c.contract.slice(0, 3)}...${c.contract.slice(-4)}`
              : c.contract;
          return (
            <Box
              key={c.contract}
              className="bubble"
              sx={{ width: 40 + c.count * 10, height: 40 + c.count * 10 }}
            >
              {short}
            </Box>
          );
        })}
      </Box>
      <Box className="bubble-map" sx={{ mt: 4 }}>
        {data.users.map((u) => {
          const short =
            u.publicKey.length > 7
              ? `${u.publicKey.slice(0, 3)}...${u.publicKey.slice(-4)}`
              : u.publicKey;
          return (
            <Avatar
              key={u.publicKey}
              src={u.pfp || undefined}
              alt={short}
              title={short}
              className="user-bubble"
              sx={{ width: 30 + u.count * 5, height: 30 + u.count * 5 }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default Trenches;
