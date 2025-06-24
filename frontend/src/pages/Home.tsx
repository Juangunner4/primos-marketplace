import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import hero from '../images/primoslogo.png';
import { getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import api from '../utils/api';
import Avatar from '@mui/material/Avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';

interface Stats {
  uniqueHolders: number | null;
  totalSupply: number | null;
  volume24hr: number | null;
  listedCount: number | null;
  floorPrice: number | null;
  solPrice: number | null;
  marketCap: number | null;
}

interface DaoMember {
  publicKey: string;
  pfp: string;
}

const MAGICEDEN_SYMBOL = 'primos';
const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

const Home: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<DaoMember[]>([]);
  const wallet = useWallet();
  const { isHolder } = usePrimoHolder();
  const isConnected = connected ?? (wallet.connected && isHolder);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [meStats, meHolderStats, solPrice] = await Promise.all([
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getMagicEdenHolderStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
        ]);
        const floor = meStats?.floorPrice ?? null;
        const supply = meHolderStats?.totalSupply ?? null;
        const mcap =
          floor !== null && supply !== null ? (floor * supply) : null;
        setStats({
          uniqueHolders: meHolderStats?.uniqueHolders ?? null,
          totalSupply: supply,
          volume24hr: meStats?.volume24hr ?? null,
          listedCount: meStats?.listedCount ?? null,
          floorPrice: floor,
          solPrice: solPrice ?? null,
          marketCap: mcap,
        });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
        setStats(null);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const fetchMembers = async () => {
      try {
        const res = await api.get<DaoMember[]>('/api/user/primos', {
          headers: { 'X-Public-Key': wallet.publicKey?.toBase58() },
        });
        const enriched = await Promise.all(
          res.data.slice(0, 5).map(async (m) => {
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
    };
    fetchMembers();
  }, [isConnected]);

  return (
    <Box
      sx={{
        textAlign: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111 0%, #23272f 100%)',
        borderRadius: '1.5rem',
        color: '#fff',
        py: 6,
      }}
    >
      <Box
      >
        {!isConnected && (
          <Button
            variant="contained"
            sx={{
              mt: 2,
              background: '#111',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: 1,
              boxShadow: '0 2px 8px #0005',
              transition: 'all 0.2s',
              '&:hover': {
                background: '#fff',
                color: '#111',
                border: '2px solid #111',
              },
            }}
            href="/market"
          >
            {t('join_primos')}
          </Button>
        )}
      </Box>
      {stats && (
        <Box
          sx={{
            mt: 6,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 5,
            background: 'linear-gradient(120deg, #23272f 60%, #111 100%)',
            borderRadius: '1.5rem',
            p: 4,
            boxShadow: '0 2px 16px #0003',
            maxWidth: 900,
            mx: 'auto',
            border: '2px solid #fff',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              left: 24,
            }}
          >
            <img
              src={hero}
              alt={t('hero_alt')}
              style={{ height: 56 }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('unique_holders')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.uniqueHolders ?? '--'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('listed')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.listedCount ?? '--'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('volume_day')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.volume24hr !== null
                ? (stats.volume24hr / 1e9).toFixed(2)
                : '--'}{' '}
              SOL
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('floor_price')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.floorPrice !== null
                ? (stats.floorPrice / 1e9).toFixed(2)
                : '--'}{' '}
              SOL
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('sol_price')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.solPrice !== null
                ? `$${Number(stats.solPrice).toFixed(2)}`
                : '--'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
              {t('market_cap')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.marketCap !== null
                ? (stats.marketCap / 1e9).toFixed(2)
                : '--'}{' '}
              SOL
            </Typography>
          </Box>
        </Box>
      )}
      <Box sx={{
        mt: 6,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 5,
        background: 'linear-gradient(120deg, #23272f 60%, #111 100%)',
        borderRadius: '1.5rem',
        p: 4,
        boxShadow: '0 2px 16px #0003',
        maxWidth: 900,
        mx: 'auto',
        border: '2px solid #fff',
        position: 'relative',
      }}>
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
      <Box sx={{
        mt: 6,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 5,
        background: 'linear-gradient(120deg, #23272f 60%, #111 100%)',
        borderRadius: '1.5rem',
        p: 4,
        boxShadow: '0 2px 16px #0003',
        maxWidth: 900,
        mx: 'auto',
        border: '2px solid #fff',
        position: 'relative',
      }}>
      </Box>
    </Box>
  );
};

export default Home;
