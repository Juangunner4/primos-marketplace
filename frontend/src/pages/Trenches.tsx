import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import './Trenches.css';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface TrenchContract {
  contract: string;
  count: number;
}

interface TrenchUser {
  publicKey: string;
  pfp: string;
  count: number;
  contracts: string[];
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
  const [viewAll, setViewAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TrenchUser | null>(null);

  const load = async () => {
    const res = await api.get<TrenchData>('/api/trench');
    const enriched = await Promise.all(
      res.data.users.map(async (u) => {
        let image = '';
        if (u.pfp) {
          const nft = await getNFTByTokenAddress(u.pfp.replace(/"/g, ''));
          image = nft?.image || '';
        } else {
          const nfts = await fetchCollectionNFTsForOwner(
            u.publicKey,
            PRIMO_COLLECTION
          );
          image = nfts[0]?.image || '';
        }
        return { ...u, pfp: image };
      })
    );
    setData({ contracts: res.data.contracts, users: enriched });
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
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
        <Button
          variant={!viewAll ? 'contained' : 'outlined'}
          onClick={() => setViewAll(false)}
        >
          {t('my_contracts')}
        </Button>
        <Button
          variant={viewAll ? 'contained' : 'outlined'}
          onClick={() => {
            setViewAll(true);
            setSelectedUser(null);
          }}
        >
          {t('all_users')}
        </Button>
      </Box>
      {!viewAll && (
        <Box className="bubble-map">
          {(data.users.find((u) => u.publicKey === publicKey?.toBase58())?.
            contracts || [])
            .map((c) => {
              const count =
                data.contracts.find((cc) => cc.contract === c)?.count || 1;
              const short =
                c.length > 7 ? `${c.slice(0, 3)}...${c.slice(-4)}` : c;
              return (
                <Box
                  key={c}
                  className="bubble"
                  sx={{ width: 40 + count * 10, height: 40 + count * 10 }}
                >
                  {short}
                </Box>
              );
            })}
        </Box>
      )}
      {viewAll && (
        <>
          <Box className="bubble-map">
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
                  onClick={() => setSelectedUser(u)}
                />
              );
            })}
          </Box>
          {selectedUser && (
            <Box className="bubble-map" sx={{ mt: 2 }}>
              {selectedUser.contracts.map((c) => {
                const count =
                  data.contracts.find((cc) => cc.contract === c)?.count || 1;
                const short =
                  c.length > 7 ? `${c.slice(0, 3)}...${c.slice(-4)}` : c;
                return (
                  <Box
                    key={c}
                    className="bubble"
                    sx={{ width: 40 + count * 10, height: 40 + count * 10 }}
                  >
                    {short}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Trenches;
