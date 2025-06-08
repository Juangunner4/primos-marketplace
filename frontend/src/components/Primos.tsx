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
import { getNFTByTokenAddress } from '../utils/helius';
import './Primos.css';

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
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  const [members, setMembers] = useState<Member[]>([]);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isConnected) return;
    async function fetchMembers() {
      try {
        const res = await axios.get<Member[]>(`${backendUrl}/api/user/members`);
        const sorted = res.data.sort((a, b) => b.pesos - a.pesos);
        setMembers(sorted);
        const imgs: Record<string, string | null> = {};
        await Promise.all(
          sorted.map(async (m) => {
            if (m.pfp) {
              try {
                const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
                imgs[m.publicKey] = nft?.image || null;
              } catch {
                imgs[m.publicKey] = null;
              }
            } else {
              imgs[m.publicKey] = null;
            }
          })
        );
        setImages(imgs);
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
                src={images[m.publicKey] || undefined}
                sx={{ width: 56, height: 56 }}
              />
              <Box ml={1}>
                <Typography>
                  {m.publicKey.slice(0, 4)}...{m.publicKey.slice(-3)}
                </Typography>
                <Typography variant="body2">
                  {t('points')}: {m.points}
                </Typography>
                <Typography variant="body2">
                  {t('pesos')}: {m.pesos}
                </Typography>
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
