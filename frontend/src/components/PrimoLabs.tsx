import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { getNFTByTokenAddress, getAssetsByCollection } from '../utils/helius';
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
  const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb'; // Use your collection mint

  useEffect(() => {
    if (!isConnected) return;

    const fetchData = async () => {
      // Fetch members from backend
      const membersRes = await axios.get<Member[]>(`${backendUrl}/api/user/members`);

      // For each member, fetch their NFT count in the Primos collection
      const withImagesAndCounts = await Promise.all(
        membersRes.data.map(async (m) => {
          let image: string | null = null;
          let count = 0;
          if (m.pfp) {
            try {
              const nft = await getNFTByTokenAddress(m.pfp.replace(/"/g, ''));
              image = nft?.image || null;
            } catch {
              image = null;
            }
          }
          try {
            const nfts = await getAssetsByCollection(PRIMOS_COLLECTION_MINT, m.publicKey);
            count = nfts.length;
          } catch {
            count = 0;
          }
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
      <Typography variant="h6" sx={{ mt: 3 }}>
        {t('labs_members_title')}
      </Typography>
      <Box className="dao-members">
        {members.map((m) => (
          <Link key={m.publicKey} to={`/user/${m.publicKey}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box className="member-card">
              <Avatar src={m.image || undefined} sx={{ width: 40, height: 40 }} />
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
      <Box className="labs-areas">
        <Box className="area-row">
          <AccountBalanceIcon className="area-icon" />
          <Typography>{t('labs_section_defi')}</Typography>
        </Box>
        <Box className="area-row">
          <EmojiEmotionsIcon className="area-icon" />
          <Typography>{t('labs_section_memes')}</Typography>
        </Box>
        <Box className="area-row">
          <SmartToyIcon className="area-icon" />
          <Typography>{t('labs_section_ai')}</Typography>
        </Box>
        <Box className="area-row">
          <BusinessCenterIcon className="area-icon" />
          <Typography>{t('labs_section_rwa')}</Typography>
        </Box>
        <Box className="area-row">
          <MoreHorizIcon className="area-icon" />
          <Typography>{t('labs_section_others')}</Typography>
        </Box>
      </Box>
      <Box
        className="floating-file"
        aria-label="Comic Files"
      >
        <FolderIcon />
      </Box>
      <Box
        className="floating-head"
        aria-label="AI Assistant"
        onMouseEnter={() => setHoverHead(true)}
        onMouseLeave={() => setHoverHead(false)}
      >
        <img src={require('../images/primosheadlogo.png')} alt="AI Head" />
        {hoverHead && (
          <Box className="speech-pill">{t('labs_ai_hint')}</Box>
        )}
      </Box>
      {isHolder && <DeFAI />}
    </Box>
  );
};

export default PrimoLabs;
