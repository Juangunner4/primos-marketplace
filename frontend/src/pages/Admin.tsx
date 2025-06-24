import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import { Box, Button, Typography, List, ListItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

interface BetaCode { code: string; }

const Admin: React.FC = () => {
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [codes, setCodes] = useState<BetaCode[]>([]);

  useEffect(() => {
    if (publicKey?.toBase58() === ADMIN_WALLET) {
      api
        .get<BetaCode[]>('/api/admin/beta/active', {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setCodes(res.data))
        .catch(() => setCodes([]));
    }
  }, [publicKey]);

  const createCode = () => {
    if (!publicKey) return;
    api
      .post<BetaCode>('/api/admin/beta', {}, {
        headers: { 'X-Public-Key': publicKey.toBase58() },
      })
      .then((res) => setCodes((c) => [...c, res.data]));
  };

  if (publicKey?.toBase58() !== ADMIN_WALLET) {
    return <Typography>{t('access_denied')}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('beta_codes')}
      </Typography>
      <Button variant="contained" onClick={createCode} sx={{ mb: 2 }}>
        {t('create_code')}
      </Button>
      <List>
        {codes.map((c, i) => (
          <ListItem key={i}>{c.code}</ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Admin;
