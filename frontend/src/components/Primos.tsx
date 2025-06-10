import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../services/helius';
import './Primos.css';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface Member {
  publicKey: string;
  pfp: string;
  points: number;
  pesos: number;
}

const Primos: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const { isHolder } = usePrimoHolder();
  const isConnected = connected ?? (wallet.connected && isHolder);
  const { t } = useTranslation();
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8080';
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isConnected) return;

    async function fetchMembers() {
      try {
        const res = await axios.get<Member[]>(`${backendUrl}/api/user/primos`);
        const sorted = res.data.slice().sort((a: Member, b: Member) => b.pesos - a.pesos);
        const enriched = await Promise.all(
          sorted.map(async (m) => {
            let image = '';
            if (m.pfp) {
              const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
              image = nft?.image || '';
            } else {
              const nfts = await fetchCollectionNFTsForOwner(m.publicKey, PRIMO_COLLECTION);
              image = nfts[0]?.image || '';
            }
            return { ...m, pfp: image };
          })
        );
        setMembers(enriched);
      } catch {
        setMembers([]);
      }
    }
    fetchMembers();
  }, [isConnected]);

  if (!isConnected) {
    return (
      <Dialog.Root open>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Typography variant="h6">{t('primos_login_prompt')}</Typography>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  const filtered = members.filter((m) =>
    m.publicKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="primos-container">
      <Typography variant="h4" className="primos-title">
        {t('primos_title')}
      </Typography>
      <TextField
        placeholder={t('primos_search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Box className="primos-list">
        {filtered.map((m) => (
          <Link
            key={m.publicKey}
            to={`/user/${m.publicKey}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box className="primos-card">
              <Avatar
                src={m.pfp || undefined}
                sx={{ width: 56, height: 56 }}
              />
              <Box ml={1}>
                <Typography>
                  {m.publicKey.slice(0, 4)}...{m.publicKey.slice(-3)}
                </Typography>
                <Box className="primos-pills">
                  <span className="primos-pill">{t('points')}: {m.points}</span>
                  <span className="primos-pill">{t('pesos')}: {m.pesos}</span>
                </Box>
              </Box>
            </Box>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Typography className="no-members">
            {t('primos_no_members')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Primos;
