import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import {
  Box,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

interface BetaCode {
  code: string;
  redeemed: boolean;
}

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
      <Button
        variant="contained"
        onClick={createCode}
        sx={{ mb: 2, background: '#000', color: '#fff' }}
      >
        {t('create_code')}
      </Button>
      <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: '#000', color: '#fff', border: '1px solid #000', fontWeight: 'bold' }}>
              {t('beta_code')}
            </TableCell>
            <TableCell align="center" sx={{ backgroundColor: '#000', color: '#fff', border: '1px solid #000', fontWeight: 'bold' }}>
              {t('redeemed')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {codes.map((c, i) => (
            <TableRow key={i}>
              <TableCell sx={{ border: '1px solid #000', padding: '8px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {c.code}
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', padding: '8px' }}>
                <Tooltip title={c.redeemed ? t('redeemed') : t('not_redeemed')}>
                  {c.redeemed ? <CheckIcon style={{ color: '#000' }} /> : <CloseIcon style={{ color: '#000' }} />}
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default Admin;
