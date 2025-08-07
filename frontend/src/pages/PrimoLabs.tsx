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
import ConstructionIcon from '@mui/icons-material/Construction';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';
import { enrichUsersWithPfp } from '../services/user';
import api from '../utils/api';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import Loading from '../components/Loading';

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
        const enriched = await enrichUsersWithPfp(membersRes.data, { useCache: true });
        setMembers(enriched.map(m => ({ ...m, pfp: m.pfpImage })));
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <ThreeDRotationIcon sx={{ fontSize: 40 }} />
              <BuildIcon sx={{ 
                position: 'absolute', 
                top: -8, 
                right: -8, 
                fontSize: 20, 
                color: '#000',
                background: '#fff',
                borderRadius: '50%',
                padding: '2px'
              }} />
            </Box>
          </Card>
        </Tooltip>
        <Tooltip title={t('experiment2_desc')} arrow>
          <Card className="lab-card" component={Link} to="/stickers" sx={{ textDecoration: 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <LocalOfferIcon sx={{ fontSize: 40 }} />
              <BuildIcon sx={{ 
                position: 'absolute', 
                top: -8, 
                right: -8, 
                fontSize: 20, 
                color: '#000',
                background: '#fff',
                borderRadius: '50%',
                padding: '2px'
              }} />
            </Box>
          </Card>
        </Tooltip>
        <Tooltip title={t('experiment3_desc')} arrow>
          <Card className="lab-card" component={Link} to="/trenches" sx={{ textDecoration: 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <MilitaryTechIcon sx={{ fontSize: 40 }} />
              <Box sx={{ 
                position: 'absolute', 
                top: -8, 
                right: -8, 
                display: 'flex', 
                gap: 0.5,
                background: '#fff',
                borderRadius: '50%',
                padding: '2px'
              }}>
                <BuildIcon sx={{ fontSize: 16, color: '#000' }} />
                <ConstructionIcon sx={{ fontSize: 16, color: '#000' }} />
              </Box>
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
