import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { useTranslation } from 'react-i18next';
import './Activity.css';

type ActivityItem = {
  id: string;
  type: 'sale' | 'listing' | 'delist' | 'mint';
  nftName: string;
  price?: number;
  from?: string;
  to?: string;
  time: string;
};

const MAGICEDEN_SYMBOL = 'primos';

const fetchMagicEdenActivity = async (): Promise<ActivityItem[]> => {
  try {
    const res = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${MAGICEDEN_SYMBOL}/activities?offset=0&limit=20`);
    if (!res.ok) return [];
    const data = await res.json();
    // Map Magic Eden activity to your ActivityItem type
    return data.map((item: any) => ({
      id: item.signature || item.txId || Math.random().toString(),
      type: item.type,
      nftName: item.tokenMint || item.name || 'NFT',
      price: item.price,
      from: item.seller || item.source || '',
      to: item.buyer || item.destination || '',
      time: item.blockTime ? new Date(item.blockTime * 1000).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

const Activity: React.FC = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchMagicEdenActivity().then(setActivity);
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
            <span className="activity-type">{typeLabels[item.type] || item.type}</span>
            <span className="activity-nft">{item.nftName}</span>
            {item.price && (
              <span className="activity-price">
                {item.price} <span className="activity-sol">◎</span>
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
