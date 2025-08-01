import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import hero from '../images/primoslogo.png';
import { getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { calculateFees } from '../utils/fees';
import { getPythSolPrice } from '../utils/pyth';
import api from '../utils/api';
import { fetchVolume24h } from '../utils/transaction';
import Avatar from '@mui/material/Avatar';
import { useWallet } from '@solana/wallet-adapter-react';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from '../utils/helius';
import Loading from '../components/Loading';

interface Stats {
  uniqueHolders: number | null;
  totalSupply: number | null;
  volume24hr: number | null;
  listedCount: number | null;
  floorPrice: number | null;
  solPrice: number | null;
  marketCap: number | null;
  marketCapUsd: number | null;
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
  const [loadingMembers, setLoadingMembers] = useState(true);
  const wallet = useWallet();
  const isConnected = connected ?? wallet.connected;

  useEffect(() => {
    async function fetchStats() {
      try {
        const [meStats, meHolderStats, solPrice, dbVolume] = await Promise.all([
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getMagicEdenHolderStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
          fetchVolume24h(),
        ]);
        // Calculate floor price including marketplace fees
        const rawFloor = meStats?.floorPrice != null ? meStats.floorPrice / 1e9 : null;
        const adjustedFloor = rawFloor != null ? rawFloor + calculateFees(rawFloor).totalFees : null;
        const supply = meHolderStats?.totalSupply ?? null;
        const mcap = adjustedFloor != null && supply != null ? adjustedFloor * supply : null;
        setStats({
          uniqueHolders: meHolderStats?.uniqueHolders ?? null,
          totalSupply: supply,
          volume24hr: dbVolume ?? meStats?.volume24hr ?? null,
          listedCount: meStats?.listedCount ?? null,
          floorPrice: adjustedFloor,
          solPrice: solPrice ?? null,
          marketCap: mcap,
          marketCapUsd: mcap != null && solPrice != null ? mcap * solPrice : null,
        });
      } catch (e) {
        console.error('Failed to fetch stats:', e);
        setStats(null);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await api.get<DaoMember[]>('/api/user/primos');
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
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

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
                ? stats.floorPrice.toFixed(3)
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
              {t('market_cap_usd')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {stats.marketCapUsd !== null
                ? `$${stats.marketCapUsd.toFixed(2)}`
                : '--'}
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
