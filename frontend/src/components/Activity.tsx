import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import './Activity.css';

type ActivityItem = {
  id: string;
  type: 'sale' | 'listing' | 'delist' | 'mint';
  nftName: string;
  price?: number;
  from?: string;
  to?: string;
  time: string; // ISO string or formatted
};

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'sale',
    nftName: 'Primo #123',
    price: 2.5,
    from: 'Alice',
    to: 'Bob',
    time: '2025-06-07T14:00:00Z',
  },
  {
    id: '2',
    type: 'listing',
    nftName: 'Primo #456',
    price: 3.1,
    from: 'Carol',
    time: '2025-06-07T13:50:00Z',
  },
  {
    id: '3',
    type: 'delist',
    nftName: 'Primo #789',
    from: 'Dave',
    time: '2025-06-07T13:40:00Z',
  },
  {
    id: '4',
    type: 'mint',
    nftName: 'Primo #101',
    to: 'Eve',
    time: '2025-06-07T13:30:00Z',
  },
];

const typeLabels: Record<ActivityItem['type'], string> = {
  sale: 'Sale',
  listing: 'Listed',
  delist: 'Delisted',
  mint: 'Minted',
};

const Activity: React.FC = () => {
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // TODO: Replace with real API call
    setActivity(mockActivity);
  }, []);

  return (
    <Box component="aside" className="activity-panel">
      <Typography variant="h6" component="h3" className="activity-title">
        Activity
      </Typography>
      <List className="activity-list">
        {activity.map((item) => (
          <ListItem key={item.id} className={`activity-row activity-${item.type}`} disableGutters>
            <span className="activity-type">{typeLabels[item.type]}</span>
            <span className="activity-nft">{item.nftName}</span>
            {item.price && (
              <span className="activity-price">
                {item.price} <span className="activity-sol">◎</span>
              </span>
            )}
            {item.from && <span className="activity-from">From: {item.from}</span>}
            {item.to && <span className="activity-to">To: {item.to}</span>}
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
