import React, { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { fetchTrenchData, submitTrenchContract } from '../services/trench';
import TelegramPanel from '../components/TelegramPanel';
import './Trenches.css';

interface TrenchContract {
  contract: string;
  count: number;
  source?: string;
  model?: string;
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
  const [tab, setTab] = useState<'my' | 'users' | 'contracts' | 'scanner'>('my');
  const [selectedUser, setSelectedUser] = useState<TrenchUser | null>(null);
  const [openContract, setOpenContract] = useState<string | null>(null);

  const multiContracts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.users.forEach((u) => {
      u.contracts.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .map(([contract, c]) => ({ contract, count: c }));
  }, [data]);

  const telegramContracts = useMemo(
    () => data.contracts.filter((c) => c.source === 'telegram'),
    [data]
  );

  const load = async () => {
    const res = await fetchTrenchData();
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!input || !publicKey) return;
    await submitTrenchContract(publicKey.toBase58(), input, 'model1');
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
      <Box className="input-row" sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
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
      <Box className="tab-row" sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
        <Button
          variant={tab === 'my' ? 'contained' : 'outlined'}
          onClick={() => {
            setTab('my');
            setSelectedUser(null);
          }}
        >
          {t('my_contracts')}
        </Button>
        <Button
          variant={tab === 'users' ? 'contained' : 'outlined'}
          onClick={() => {
            setTab('users');
            setSelectedUser(null);
          }}
        >
          {t('all_users')}
        </Button>
        <Button
          variant={tab === 'contracts' ? 'contained' : 'outlined'}
          onClick={() => {
            setTab('contracts');
            setSelectedUser(null);
          }}
        >
          {t('all_contracts')}
        </Button>
        <Button
          variant={tab === 'scanner' ? 'contained' : 'outlined'}
          onClick={() => {
            setTab('scanner');
            setSelectedUser(null);
          }}
        >
          {t('scanner')}
        </Button>
      </Box>
      {tab === 'my' && (
        <>
          {(
            data.users.find((u) => u.publicKey === publicKey?.toBase58())?.
              contracts || []
          ).length === 0 ? (
            <Typography sx={{ mt: 2 }}>{t('no_scans')}</Typography>
          ) : (
            <Box className="bubble-map">
              {(data.users.find((u) => u.publicKey === publicKey?.toBase58())?.
                contracts || [])
                .map((c) => {
                  const count =
                    data.contracts.find((cc) => cc.contract === c)?.count || 1;
                  const short =
                    c.length > 7 ? `${c.slice(0, 3)}...${c.slice(-4)}` : c;
                  const size = Math.max(
                    40,
                    Math.min(100, 40 + count * 10)
                  );
                  const meta = data.contracts.find((cc) => cc.contract === c);
                  return (
                    <Box
                      key={c}
                      className="bubble"
                      sx={{ width: size, height: size, fontSize: size / 5 }}
                      onClick={() => setOpenContract(c)}
                    >
                      {short}
                      {meta?.model && (
                        <Box className="model-tag">{meta.model}</Box>
                      )}
                    </Box>
                  );
                })}
            </Box>
          )}
        </>
      )}
      {tab === 'users' && (
        <>
          {data.users.length === 0 ? (
            <Typography sx={{ mt: 2 }}>{t('no_scans')}</Typography>
          ) : (
            <Box className="bubble-map">
              {data.users.map((u) => {
                const short =
                  u.publicKey.length > 7
                    ? `${u.publicKey.slice(0, 3)}...${u.publicKey.slice(-4)}`
                    : u.publicKey;
                const size = Math.max(
                  30,
                  Math.min(80, 30 + u.count * 5)
                );
                return (
                  <Avatar
                    key={u.publicKey}
                    src={u.pfp || undefined}
                    alt={short}
                    title={short}
                    className="user-bubble"
                    sx={{ width: size, height: size }}
                    onClick={() => setSelectedUser(u)}
                  />
                );
              })}
            </Box>
          )}
          {selectedUser && (
            <Box className="bubble-map" sx={{ mt: 2 }}>
              {selectedUser.contracts.map((c) => {
                const count =
                  data.contracts.find((cc) => cc.contract === c)?.count || 1;
                const short =
                  c.length > 7 ? `${c.slice(0, 3)}...${c.slice(-4)}` : c;
                const size = Math.max(
                  40,
                  Math.min(100, 40 + count * 10)
                );
                return (
                  <Box
                    key={c}
                    className="bubble"
                    sx={{ width: size, height: size, fontSize: size / 5 }}
                    onClick={() => setOpenContract(c)}
                  >
                    {short}
                    {data.contracts.find((cc) => cc.contract === c)?.model && (
                      <Box className="model-tag">
                        {data.contracts.find((cc) => cc.contract === c)?.model}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
      {tab === 'contracts' && (
        <>
          {multiContracts.length === 0 ? (
            <Typography sx={{ mt: 2 }}>{t('no_scans')}</Typography>
          ) : (
            <Box className="bubble-map">
              {multiContracts.map((c) => {
                const short =
                  c.contract.length > 7
                    ? `${c.contract.slice(0, 3)}...${c.contract.slice(-4)}`
                    : c.contract;
                const size = Math.max(
                  40,
                  Math.min(100, 40 + c.count * 10)
                );
                return (
                  <Box
                    key={c.contract}
                    className="bubble"
                    sx={{ width: size, height: size, fontSize: size / 5 }}
                    onClick={() => setOpenContract(c.contract)}
                  >
                    {short}
                    {data.contracts.find((cc) => cc.contract === c.contract)?.model && (
                      <Box className="model-tag">
                        {data.contracts.find((cc) => cc.contract === c.contract)?.model}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
      {tab === 'scanner' && (
        <>
          {telegramContracts.length === 0 ? (
            <Typography sx={{ mt: 2 }}>{t('no_scans')}</Typography>
          ) : (
            <Box className="bubble-map">
              {telegramContracts.map((c) => {
                const short =
                  c.contract.length > 7
                    ? `${c.contract.slice(0, 3)}...${c.contract.slice(-4)}`
                    : c.contract;
                const size = 60;
                return (
                  <Box
                    key={c.contract}
                    className="bubble"
                    sx={{ width: size, height: size, fontSize: size / 5 }}
                    onClick={() => setOpenContract(c.contract)}
                  >
                    {short}
                    {c.model && <Box className="model-tag">{c.model}</Box>}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
      <TelegramPanel
        contract={openContract}
        open={openContract !== null}
        onClose={() => setOpenContract(null)}
      />
    </Box>
  );
};

export default Trenches;
