import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BuildIcon from '@mui/icons-material/Build';
import HomeIcon from '@mui/icons-material/Home';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import api from '../utils/api';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import Loading from '../components/Loading';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;
type Member = { publicKey: string; pfp: string };

const PrimoLabs: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const { isHolder } = usePrimoHolder();
  const isConnected = connected ?? (wallet.connected && isHolder);
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    const fetchData = async () => {
      setLoadingMembers(true);
      try {
        const membersRes = await api.get<Member[]>('/api/user/primos', {
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
      } finally {
        setLoadingMembers(false);
      }
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
        <Tooltip title={t('experiment1_desc')} arrow>
          <Card className="lab-card" component={Link} to="/experiment1" sx={{ textDecoration: 'none' }}>
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ThreeDRotationIcon sx={{ fontSize: 40 }} />
              <BuildIcon sx={{ position: 'absolute', bottom: 0, right: 0, fontSize: 20 }} />
            </Box>
          </Card>
        </Tooltip>
        <Tooltip title={t('experiment2_desc')} arrow>
          <Card className="lab-card" component={Link} to="/stickers" sx={{ textDecoration: 'none' }}>
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LocalOfferIcon sx={{ fontSize: 40 }} />
              <BuildIcon sx={{ position: 'absolute', bottom: 0, right: 0, fontSize: 20 }} />
            </Box>
          </Card>
        </Tooltip>
        <Tooltip title={t('experiment3_desc')} arrow>
          <Card className="lab-card" component={Link} to="/trenches" sx={{ textDecoration: 'none' }}>
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MilitaryTechIcon sx={{ fontSize: 40 }} />
              <BuildIcon sx={{ position: 'absolute', bottom: 0, left: 0, fontSize: 20 }} />
              <HomeIcon sx={{ position: 'absolute', bottom: 0, right: 0, fontSize: 20 }} />
            </Box>
          </Card>
        </Tooltip>
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
      {loadingMembers ? (
        <Loading message={t('primos_loading')} />
      ) : (
        members.length > 0 && (
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
        )
      )}
    </Box>
  );
};

export default PrimoLabs;
