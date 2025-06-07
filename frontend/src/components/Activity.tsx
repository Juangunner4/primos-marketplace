import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { useTranslation } from 'react-i18next';
import './Activity.css';
import { fetchMagicEdenActivity } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';

type ActivityItem = {
  id: string;
  type: 'sale' | 'listing' | 'delist' | 'mint';
  nftName: string;
  price?: number;
  from?: string;
  to?: string;
  time: string;
  image?: string;
};

const MAGICEDEN_SYMBOL = 'primos';

const Activity: React.FC = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const { t } = useTranslation();

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
          return {
            id: item.signature ?? item.txId ?? Math.random().toString(),
            type: item.type,
            nftName,
            price: item.price,
            from: item.seller ?? item.source ?? '',
            to: item.buyer ?? item.destination ?? '',
            time: item.blockTime
              ? new Date(item.blockTime * 1000).toISOString()
              : new Date().toISOString(),
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

  return (
    <Box component="aside" className="activity-panel">
      <Typography variant="h6" component="h3" className="activity-title">
        {t('activity')}
      </Typography>
      <List className="activity-list">
        {activity.map((item) => (
          <ListItem key={item.id} className={`activity-row activity-${item.type}`} disableGutters>
            {item.image && (
              <img src={item.image} alt={item.nftName} style={{ width: 32, height: 32, borderRadius: 6, marginRight: 8, objectFit: 'cover' }} />
            )}
            <span className="activity-type">{typeLabels[item.type] || item.type}</span>
            <span className="activity-nft">{item.nftName}</span>
            {item.price && (
              <span className="activity-price">
                {item.price} <span className="activity-sol"></span>
              </span>
            )}
            {item.from && <span className="activity-from">{t('activity_from')}: {item.from}</span>}
            {item.to && <span className="activity-to">{t('activity_to')}: {item.to}</span>}
            <span className="activity-time">
              {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Activity;

