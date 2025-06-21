import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import axios from 'axios';
import { getBackendUrl } from '../utils/env';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;
type Member = { publicKey: string; pfp: string };

const PrimoLabs: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const { isHolder } = usePrimoHolder();
  const isConnected = connected ?? (wallet.connected && isHolder);
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (!isConnected) return;

    const fetchData = async () => {
      const membersRes = await axios.get<Member[]>(`${backendUrl}/api/user/primos`, {
        headers: { 'X-Public-Key': wallet.publicKey?.toBase58() },
      });
      const enriched = await Promise.all(
        membersRes.data.map(async (m) => {
          let image = '';
          if (m.pfp) {
            const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
            image = nft?.image ?? '';
          } else {
            const nfts = await fetchCollectionNFTsForOwner(m.publicKey, PRIMO_COLLECTION);
            image = nfts[0]?.image ?? '';
          }
          return { ...m, pfp: image };
        })
      );
      setMembers(enriched);
    };

    fetchData();
  }, [isConnected]);

  if (!isConnected) {
    return (
      <Dialog.Root open>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Typography variant="h6">
            {t('primo_labs_login_prompt')}
          </Typography>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Box className="labs-container">
      <Box className="labs-grid">
        <Card className="lab-card meme-wars">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('labs_meme_wars')}
          </Typography>
        </Card>
        <Card className="lab-card eliza-bot">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('labs_eliza_bot')}
          </Typography>
        </Card>
        <Card className="lab-card">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('coming_soon')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>1 / 100</Typography>
          <LinearProgress variant="determinate" value={1} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1 }} />
        </Card>
        <Card className="lab-card">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('coming_soon')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>1 / 100</Typography>
          <LinearProgress variant="determinate" value={1} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1 }} />
        </Card>
        <Card className="lab-card">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('coming_soon')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>1 / 100</Typography>
          <LinearProgress variant="determinate" value={1} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1 }} />
        </Card>
        <Card className="lab-card">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('coming_soon')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>1 / 100</Typography>
          <LinearProgress variant="determinate" value={1} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1 }} />
        </Card>
      </Box>
      {members.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
            {t('primos_title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            {members.map((m) => (
              <Avatar
                key={m.publicKey}
                src={m.pfp || undefined}
                sx={{ width: 24, height: 24 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PrimoLabs;
