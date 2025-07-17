import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import './Activity.css';
import { fetchMagicEdenActivity } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { getPythSolPrice } from '../utils/pyth';
import NFTCard, { MarketNFT } from './NFTCard';

type ActivityItem = {
  id: string;
  type: 'sale' | 'listing' | 'delist' | 'mint';
  nftName: string;
  price?: number;
  time: string;
  image?: string;
};

const MAGICEDEN_SYMBOL = 'primos';

const Activity: React.FC = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [selectedNft, setSelectedNft] = useState<MarketNFT | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isNarrow = useMediaQuery('(max-width:700px)');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMobile || !open) return;
    const handleClick = (e: MouseEvent) => {
      if (cardOpen) return;
      const drawer = document.querySelector('.MuiDrawer-paper');
      if (drawer && !drawer.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isMobile, open, cardOpen]);

  useEffect(() => {
    getPythSolPrice().then((p) => setSolPrice(p));
  }, []);

  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;

    const fetchActivityWithImages = async () => {
      const rawActivity = await fetchMagicEdenActivity(MAGICEDEN_SYMBOL, 0, 20);
      const activityWithImages = await Promise.all(
        rawActivity.map(async (item: any) => {
          let nftName = item.tokenMint ?? item.name ?? 'NFT';
          let image: string | undefined;
          if (item.tokenMint) {
            const nft = await getNFTByTokenAddress(item.tokenMint);
            if (nft) {
              nftName = nft.name;
              image = nft.image;
            }
          }
          let time: string;
          if (typeof item.blockTime === 'number' && !isNaN(item.blockTime)) {
            const date = new Date(item.blockTime * 1000);
            time = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
          } else {
            time = new Date().toISOString();
          }
          return {
            id: item.signature ?? item.txId ?? Math.random().toString(),
            type: item.type,
            nftName,
            price: item.price,
            time,
            image,
          } as ActivityItem;
        })
      );

      if (!isMounted) return;
      setActivity((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const merged = [
          ...activityWithImages.filter((a) => !existing.has(a.id)),
          ...prev,
        ];
        return merged.slice(0, 50);
      });
    };

    fetchActivityWithImages();
    interval = setInterval(fetchActivityWithImages, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const typeLabels: Record<ActivityItem['type'], string> = {
    sale: t('activity_sale'),
    listing: t('activity_listing'),
    delist: t('activity_delist'),
    mint: t('activity_mint'),
  };

  const panelContent = (
    <Box component="aside" className={`activity-panel${isMobile ? '' : ' activity-desktop'}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h3" className="activity-title">
          {t('activity')}
        </Typography>
        {isMobile && (
          <IconButton aria-label="close activity" onClick={() => setOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <List className="activity-list">
        {activity.map((item, idx) => (
          <ListItem
            key={item.id + '-' + idx}
            className={`activity-row activity-${item.type}`}
            disableGutters
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.nftName}
                onClick={() => {
                  const nft: MarketNFT = {
                    id: item.id,
                    image: item.image!,
                    name: item.nftName,
                    price: item.price ?? 0,
                    variant: 'yellow',
                    rank: null,
                  };
                  setSelectedNft(nft);
                  setCardOpen(true);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  marginRight: 8,
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
              />
            )}
            {item.type === 'listing' ? (
              <span className="activity-pill listing-pill">
                <span className="paper-hand" style={{ marginRight: 4 }}>🫲</span>{' '}
                {t('activity_listing')}
              </span>
            ) : (
              <span className="activity-type">{typeLabels[item.type] || item.type}</span>
            )}
            <span className="activity-nft">{item.nftName}</span>
            <span className="activity-time">
              {new Date(item.time).toLocaleString()}
            </span>
            {item.price && (
              <span className="activity-price">
                {item.price.toFixed(3)} SOL
                {solPrice && (
                  <span className="usd"> (${(item.price * solPrice).toFixed(2)})</span>
                )}
              </span>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {cardOpen && (
        <div
          className="nft-modal-wrapper activity-modal"
          style={{ zIndex: 1400 }}
        >
          <NFTCard
            nft={selectedNft}
            open={cardOpen}
            onClose={() => setCardOpen(false)}
            solPriceUsd={solPrice ?? undefined}
          />
        </div>
      )}
      {isMobile ? (
        <>
          <IconButton
            aria-label="open activity"
            onClick={() => setOpen((prev) => !prev)}
            className="activity-mobile-btn"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1301,
              background: '#000',
              color: '#fff',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              '&:hover': { background: '#222' },
            }}
          >
            <HistoryIcon />
          </IconButton>
          {mounted && (
            <Drawer
              anchor="right"
              open={open}
              onClose={() => setOpen(false)}
              ModalProps={{ keepMounted: true }}
              sx={{
                [`& .MuiDrawer-paper`]: {
                  width: isNarrow ? '100vw' : 340,
                  boxSizing: 'border-box',
                  top: 80,
                  height: 'calc(100vh - 80px)',
                },
              }}
            >
              {panelContent}
            </Drawer>
          )}
        </>
      ) : (
        panelContent
      )}
    </>
  );
};

export default Activity;

