import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { getNFTByTokenAddress } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import axios from 'axios';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import DeFAI from './DeFAI';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FolderIcon from '@mui/icons-material/Folder';

const MAGICEDEN_SYMBOL = 'primos';
type Member = { publicKey: string; pfp: string };
type MemberWithImage = { publicKey: string; image: string | null; count: number };

const PrimoLabs: React.FC<{ connected?: boolean }> = ({ connected }) => {
  const wallet = useWallet();
  const { isHolder } = usePrimoHolder();
  const isConnected = connected ?? (wallet.connected && isHolder);
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberWithImage[]>([]);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [hoverHead, setHoverHead] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

  useEffect(() => {
    if (!isConnected) return;

    const fetchData = async () => {
      // Fetch members from backend
      const membersRes = await axios.get<Member[]>(`${backendUrl}/api/user/primos`);
      const countsRes = await axios.get<Record<string, number>>(
        `${backendUrl}/api/stats/member-nft-counts`
      );

      // For each member, attach image and count
      const withImagesAndCounts = await Promise.all(
        membersRes.data.map(async (m) => {
          let image: string | null = null;
          if (m.pfp) {
            try {
              const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
              image = nft?.image || null;
            } catch {
              image = null;
            }
          }
          const count = countsRes.data[m.publicKey] ?? 0;
          return {
            publicKey: m.publicKey,
            image,
            count,
          };
        })
      );

      setMembers(withImagesAndCounts);

      // Calculate totalOwned
      const totalOwned = withImagesAndCounts.reduce((a, b) => a + (b.count || 0), 0);

      const statsPromise = getMagicEdenStats(MAGICEDEN_SYMBOL);
      const solPromise = getPythSolPrice();

      const [stats, sol] = await Promise.all([
        statsPromise,
        solPromise,
      ]);

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
            {t('primo_labs_login_prompt')}
          </Typography>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Box className="labs-container">
      <Typography variant="h4" className="labs-title">
        {t('primo_labs')}
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
          {t('labs_owned')}: {members.reduce((acc, member) => acc + (member.count || 0), 0)}
        </Typography>
        <Typography>
          {t('labs_sol_price')}: {solPrice !== null ? solPrice.toFixed(2) : '--'}
        </Typography>
        <Typography>
          {t('labs_total_value')}:{' '}
          {floorPrice !== null && solPrice !== null
            ? `${(members.reduce((acc, member) => acc + (member.count || 0), 0) * floorPrice).toFixed(2)} SOL / ${(members.reduce((acc, member) => acc + (member.count || 0), 0) * floorPrice * solPrice).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}`
            : '--'}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('primo_labs_stats_desc')}
      </Typography>

      <Box className="labs-grid">
        <Card className="lab-card">
            <Box className="lab-card-header" display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('labs_section_defi')}</Typography>
            </Box>
        </Card>
        <Card className="lab-card">
          <Box className="lab-card-header" display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('labs_section_memes')}</Typography>
            <Button size="small" sx={{ color: '#ffffff', textTransform: 'none' }}>
              Browse →
            </Button>
          </Box>
          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography sx={{ color: '#aaaaaa' }}>⇄ 24h Volume</Typography>
              <Typography sx={{ color: '#ffffff' }}>1 SOL</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography sx={{ color: '#aaaaaa' }}>⇄ 24h PnL</Typography>
              <Typography sx={{ color: '#ffffff' }}>-1 SOL</Typography>
            </Box>
          </Box>
        </Card>
        <Card className="lab-card">
          <Typography variant="h6" sx={{ mt: 1 }}>
            {t('coming_soon')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>1 / 100</Typography>
          <LinearProgress variant="determinate" value={1} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1 }} />
        </Card>
        <Card className="lab-card">
            <Box className="lab-card-header" display="flex" justifyContent="space-between" mb={1}>
            <Typography>{t('labs_members_title')}</Typography>
            {members.map((m) => (
              <Link key={m.publicKey} to={`/user/${m.publicKey}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box className="member-card">
                  <Avatar src={m.image ?? undefined} sx={{ width: 40, height: 40 }} />
                  <Typography sx={{ ml: 1 }}>
                    {m.publicKey.slice(0, 4)}...{m.publicKey.slice(-3)}
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    NFTs: {m.count}
                  </Typography>
                </Box>
              </Link>
            ))}
          </Box>
        </Card>
      </Box>
      <Box
        className="floating-file"
        aria-label="Comic Files"
      >
        <FolderIcon />
      </Box>
      {isHolder && <DeFAI />}
    </Box>
  );
};

export default PrimoLabs;
