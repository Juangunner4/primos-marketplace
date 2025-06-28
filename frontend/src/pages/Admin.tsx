import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import {
  Box,
  Button,
  ButtonGroup,
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
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

interface BetaCode {
  code: string;
  redeemed: boolean;
}

interface AdminStats {
  totalWallets: number;
  totalPoints: number;
  primoHolders: number;
  betaCodes: number;
  betaCodesRedeemed: number;
}

const Admin: React.FC = () => {
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (publicKey?.toBase58() === ADMIN_WALLET) {
      api
        .get<BetaCode[]>(`/api/admin/beta/${filter}`, {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setCodes(res.data))
        .catch(() => setCodes([]));
      api
        .get<AdminStats>('/api/admin/stats', {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setStats(res.data))
        .catch(() => setStats(null));
    }
  }, [publicKey, filter]);

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
    <Tabs.Root defaultValue="codes">
      <Tabs.List style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Tabs.Trigger
          value="codes"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            border: '1px solid #000',
            borderRadius: 4,
          }}
        >
          <ListAltIcon fontSize="small" style={{ marginRight: 4 }} />
          {t('beta_codes')}
        </Tabs.Trigger>
        <Tabs.Trigger
          value="stats"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '6px 12px',
            background: '#000',
            color: '#fff',
            border: '1px solid #000',
            borderRadius: 4,
          }}
        >
          <BarChartIcon fontSize="small" style={{ marginRight: 4 }} />
          {t('stats')}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="codes">
        <Box mb={2} display="flex" gap={1} alignItems="center">
          <ButtonGroup>
            <Button
              variant={filter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setFilter('active')}
              startIcon={<CheckIcon />}
              sx={{ background: filter === 'active' ? '#000' : undefined, color: filter === 'active' ? '#fff' : undefined }}
            >
              {t('active_codes')}
            </Button>
            <Button
              variant={filter === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => setFilter('inactive')}
              startIcon={<CloseIcon />}
              sx={{ background: filter === 'inactive' ? '#000' : undefined, color: filter === 'inactive' ? '#fff' : undefined }}
            >
              {t('redeemed_codes')}
            </Button>
          </ButtonGroup>
          <Button variant="contained" onClick={createCode} sx={{ background: '#000', color: '#fff', ml: 1 }}>
            {t('create_code')}
          </Button>
        </Box>
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
      </Tabs.Content>

      <Tabs.Content value="stats">
        {stats && (
          <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_wallets')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.totalWallets}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_points')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.totalPoints}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('primo_holders')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.primoHolders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_beta')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.betaCodes}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{t('total_beta_redeemed')}</TableCell>
                <TableCell sx={{ border: '1px solid #000' }}>{stats.betaCodesRedeemed}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default Admin;
