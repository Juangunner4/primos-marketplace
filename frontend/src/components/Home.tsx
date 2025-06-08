import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import News from './News';
import hero from '../images/primoslogo.png';

interface Stats {
  daoMembers: number;
  uniqueHolders: number | null;
  totalSupply: number | null;
  volume24hr: number | null;
  listedCount: number | null;
  floorPrice: number | null;
  solPrice: number | null;
}

const MAGICEDEN_SYMBOL = 'primos';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [membersRes, meStats, holderStats, sol] = await Promise.all([
          axios.get(`${backendUrl}/api/user/members`),
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getMagicEdenHolderStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
        ]);
        setStats({
          daoMembers: membersRes.data.length,
          uniqueHolders: holderStats?.uniqueHolders ?? null,
          totalSupply: holderStats?.totalSupply ?? null,
          volume24hr: meStats?.volume24hr ?? null,
          listedCount: meStats?.listedCount ?? null,
          floorPrice: meStats?.floorPrice ?? null,
          solPrice: sol ?? null,
        });
      } catch (e) {
        setStats(null);
      }
    }
    fetchStats();
  }, [backendUrl]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ mt: 2 }}>
        <img src={hero} alt="Primos" style={{ width: 160 }} />
        <Typography variant="h4" sx={{ mt: 2 }}>
          {t('home_welcome')}
        </Typography>
        <Typography variant="body1">{t('home_tagline')}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} href="https://twitter.com/primosxyz">
          {t('join_primos')}
        </Button>
      </Box>
      {stats && (
        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
          <Box>
            <Typography variant="h6">{t('dao_members')}</Typography>
            <Typography>{stats.daoMembers}</Typography>
          </Box>
          <Box>
            <Typography variant="h6">{t('unique_holders')}</Typography>
            <Typography>{stats.uniqueHolders ?? '--'}</Typography>
          </Box>
          <Box>
            <Typography variant="h6">{t('listed')}</Typography>
            <Typography>{stats.listedCount ?? '--'}</Typography>
          </Box>
          <Box>
            <Typography variant="h6">{t('volume_day')}</Typography>
            <Typography>
              {stats.volume24hr !== null ? (stats.volume24hr / 1e9).toFixed(2) : '--'} SOL
            </Typography>
          </Box>
        </Box>
      )}
      <News />
    </Box>
  );
};

export default Home;
