import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import axios from 'axios';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';

type PrimoLabsProps = {
  connected?: boolean;
};

const PrimoLabs: React.FC<PrimoLabsProps> = ({ connected }) => {
  const wallet = useWallet();
  const isConnected = connected ?? wallet.connected;
  const { t } = useTranslation();
  const [members, setMembers] = useState<{ publicKey: string; pfp: string }[]>([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    if (isConnected) {
      axios.get(`${backendUrl}/api/user/members`).then(res => setMembers(res.data));
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <Dialog.Root open>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Typography variant="h6">
            Please login to access Primo Labs
          </Typography>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Box className="labs-container">
      <Typography variant="h4" className="labs-title">
        Primo Labs
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('primo_labs_desc')}
      </Typography>
      <Box className="nft-stats">
        <Typography variant="h6">{t('labs_nft_section')}</Typography>
        <Typography>{t('labs_floor_price')}: --</Typography>
        <Typography>{t('labs_owned')}: 0</Typography>
        <Typography>{t('labs_sol_price')}: --</Typography>
        <Typography>{t('labs_total_value')}: --</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('primo_labs_stats_desc')}
      </Typography>
      <Typography variant="h6" sx={{ mt: 3 }}>
        {t('labs_members_title')}
      </Typography>
      <Box className="dao-members">
        {members.map((m) => (
          <Box key={m.publicKey} className="member-card">
            <Avatar src={m.pfp} sx={{ width: 40, height: 40 }} />
            <Typography sx={{ ml: 1 }}>
              {m.publicKey.slice(0, 4)}...{m.publicKey.slice(-3)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PrimoLabs;
