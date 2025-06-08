import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { getNFTByTokenAddress } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import axios from 'axios';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';

const MAGICEDEN_SYMBOL = 'primos';
type Member = { publicKey: string; pfp: string };
type MemberWithImage = { publicKey: string; image: string | null };

const PrimoLabs: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const isConnected = connected ?? wallet.connected;
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberWithImage[]>([]);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [ownedCount, setOwnedCount] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    if (!isConnected) return;

    const fetchData = async () => {
      const membersPromise = axios.get<Member[]>(`${backendUrl}/api/user/members`);
      const countsPromise = axios.get<{ publicKey: string; count: number }[]>(
        `${backendUrl}/api/stats/member-nft-counts`
      );

      const [res, countsRes] = await Promise.all([membersPromise, countsPromise]);

      const imagePromises = res.data.map(async (m) => {
        if (m.pfp) {
          try {
            const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
            return { publicKey: m.publicKey, image: nft?.image || null };
          } catch {
            return { publicKey: m.publicKey, image: null };
          }
        }
        return { publicKey: m.publicKey, image: null };
      });

      const statsPromise = getMagicEdenStats(MAGICEDEN_SYMBOL);
      const solPromise = getPythSolPrice();

      const [withImages, counts, stats, sol] = await Promise.all([
        Promise.all(imagePromises),
        Promise.resolve(countsRes.data),
        statsPromise,
        solPromise,
      ]);

      setMembers(withImages);

      const totalOwned = counts.reduce((a, b) => a + b.count, 0);
      setOwnedCount(totalOwned);

      const fp = stats?.floorPrice ? stats.floorPrice / 1e9 : null;
      setFloorPrice(fp);
      setSolPrice(sol ?? null);
      if (fp !== null) {
        setTotalValue(totalOwned * fp);
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
        <Typography>
          {t('labs_floor_price')}: {floorPrice !== null ? floorPrice.toFixed(2) : '--'}
        </Typography>
        <Typography>
          {t('labs_owned')}: {ownedCount}
        </Typography>
        <Typography>
          {t('labs_sol_price')}: {solPrice !== null ? solPrice.toFixed(2) : '--'}
        </Typography>
        <Typography>
          {t('labs_total_value')}:{' '}
          {totalValue !== null ? totalValue.toFixed(2) : '--'}
        </Typography>
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
            <Avatar src={m.image || undefined} sx={{ width: 40, height: 40 }} />
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
