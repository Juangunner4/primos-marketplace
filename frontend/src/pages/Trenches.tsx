import React, { useEffect, useState, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import {
  fetchTrenchData,
  submitTrenchContract,
  TrenchContract,
  TrenchUser,
  TrenchData,
} from '../services/trench';
import ContractPanel from '../components/ContractPanel';
import MessageModal from '../components/MessageModal';
import { AppMessage } from '../types';
import './Trenches.css';

const Trenches: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [data, setData] = useState<TrenchData>({ contracts: [], users: [] });
  const [tab, setTab] = useState<'my' | 'users' | 'contracts' | 'scanner'>('my');
  const [selectedUser, setSelectedUser] = useState<TrenchUser | null>(null);
  const [openContract, setOpenContract] = useState<string | null>(null);
  const [message, setMessage] = useState<AppMessage | null>(null);

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
    setError(null);
    if (!input || !publicKey) return;
    let valid = false;
    // Ethereum address check
    if (/^0x[0-9a-fA-F]{40}$/.test(input)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${input}`);
        if (res.ok) valid = true;
      } catch {}
    }
    // Solana account check
    if (!valid) {
      try {
        const addr = new PublicKey(input);
        const info = await connection.getAccountInfo(addr);
        if (info) valid = true;
      } catch {}
    }
    if (!valid) {
      setError(t('contract_not_onchain'));
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
      <Box className="input-row" sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('enter_contract')}
          size="small"
        />
        <Button variant="contained" onClick={handleAdd} disabled={!input} sx={{
          backgroundColor: '#000',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#333',
          },
          '&:disabled': {
            backgroundColor: '#ccc',
            color: '#666',
          }
        }}>
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
          sx={{
            backgroundColor: tab === 'my' ? '#000' : 'transparent',
            color: tab === 'my' ? '#fff' : '#000',
            borderColor: '#000',
            '&:hover': {
              backgroundColor: tab === 'my' ? '#333' : '#f0f0f0',
              borderColor: '#000',
            }
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
          sx={{
            backgroundColor: tab === 'users' ? '#000' : 'transparent',
            color: tab === 'users' ? '#fff' : '#000',
            borderColor: '#000',
            '&:hover': {
              backgroundColor: tab === 'users' ? '#333' : '#f0f0f0',
              borderColor: '#000',
            }
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
          sx={{
            backgroundColor: tab === 'contracts' ? '#000' : 'transparent',
            color: tab === 'contracts' ? '#fff' : '#000',
            borderColor: '#000',
            '&:hover': {
              backgroundColor: tab === 'contracts' ? '#333' : '#f0f0f0',
              borderColor: '#000',
            }
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
          sx={{
            backgroundColor: tab === 'scanner' ? '#000' : 'transparent',
            color: tab === 'scanner' ? '#fff' : '#000',
            borderColor: '#000',
            '&:hover': {
              backgroundColor: tab === 'scanner' ? '#333' : '#f0f0f0',
              borderColor: '#000',
            }
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
                  const size = Math.max(
                    40,
                    Math.min(100, 40 + count * 10)
                  );
                  const meta = data.contracts.find((cc) => cc.contract === c);
                  return (
                    <button
                      key={c}
                      className="bubble"
                      aria-label={c}
                      title={c}
                      style={{
                        width: size,
                        height: size,
                        backgroundImage: meta?.image ? `url(${meta.image})` : undefined,
                        backgroundSize: 'cover',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        padding: 0,
                        outline: 'none',
                      }}
                      onClick={() => setOpenContract(c)}
                      onDoubleClick={() => handleCopy(c)}
                    >
                      {meta?.model && (
                        <Box className="model-tag">{meta.model}</Box>
                      )}
                    </button>
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
                const size = Math.max(
                  40,
                  Math.min(100, 40 + count * 10)
                );
                const meta = data.contracts.find((cc) => cc.contract === c);
                return (
                  <button
                    key={c}
                    className="bubble"
                    aria-label={c}
                    title={c}
                    style={{
                      width: size,
                      height: size,
                      backgroundImage: meta?.image ? `url(${meta.image})` : undefined,
                      backgroundSize: 'cover',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    onClick={() => setOpenContract(c)}
                    onDoubleClick={() => handleCopy(c)}
                  >
                    {data.contracts.find((cc) => cc.contract === c)?.model && (
                      <Box className="model-tag">
                        {data.contracts.find((cc) => cc.contract === c)?.model}
                      </Box>
                    )}
                  </button>
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
                const size = Math.max(
                  40,
                  Math.min(100, 40 + c.count * 10)
                );
                const meta = data.contracts.find((cc) => cc.contract === c.contract);
                return (
                  <button
                    key={c.contract}
                    className="bubble"
                    aria-label={c.contract}
                    title={c.contract}
                    style={{
                      width: size,
                      height: size,
                      backgroundImage: meta?.image ? `url(${meta.image})` : undefined,
                      backgroundSize: 'cover',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    onClick={() => setOpenContract(c.contract)}
                    onDoubleClick={() => handleCopy(c.contract)}
                  >
                    {data.contracts.find((cc) => cc.contract === c.contract)?.model && (
                      <Box className="model-tag">
                        {data.contracts.find((cc) => cc.contract === c.contract)?.model}
                      </Box>
                    )}
                  </button>
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
                const size = 60;
                const meta = data.contracts.find((cc) => cc.contract === c.contract);
                return (
                  <button
                    key={c.contract}
                    className="bubble"
                    aria-label={c.contract}
                    title={c.contract}
                    style={{
                      width: size,
                      height: size,
                      backgroundImage: meta?.image ? `url(${meta.image})` : undefined,
                      backgroundSize: 'cover',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    onClick={() => setOpenContract(c.contract)}
                    onDoubleClick={() => handleCopy(c.contract)}
                  >
                    {c.model && <Box className="model-tag">{c.model}</Box>}
                  </button>
                );
              })}
            </Box>
          )}
        </>
      )}
      <ContractPanel
        contract={openContract}
        open={openContract !== null}
        onClose={() => setOpenContract(null)}
      />
      <MessageModal
        open={message !== null}
        message={message}
        onClose={() => setMessage(null)}
      />
    </Box>
  );
};

export default Trenches;
