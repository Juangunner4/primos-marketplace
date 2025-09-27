import React from 'react';
import { Card, CardMedia, CardActions, Button, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import './WeysMarketGallery.css';

const merchItems = [
  { id: 1, name: 'Weys T-Shirt', image: 'https://placehold.co/400x400?text=T-Shirt', price: '$25' },
  { id: 2, name: 'Weys Cap', image: 'https://placehold.co/400x400?text=Cap', price: '$20' },
  { id: 3, name: 'Weys Mug', image: 'https://placehold.co/400x400?text=Mug', price: '$15' },
  { id: 4, name: 'Weys Sticker', image: 'https://placehold.co/400x400?text=Sticker', price: '$5' },
];

const Merch: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box className="market-gallery">
      <Box className="market-header-row">
        <Typography className="market-title">{t('merch_title')}</Typography>
      </Box>
      <Box className="market-nft-list nft-list">
        {merchItems.map((item) => (
          <Card key={item.id} className="market-card">
            <CardMedia
              component="img"
              image={item.image}
              alt={item.name}
              className="market-nft-img"
            />
            <CardActions className="market-card-footer">
              <Typography className="market-nft-name">{item.name}</Typography>
              <Typography className="market-nft-price">{item.price}</Typography>
              <Button variant="contained" color="primary">
                {t('buy_now')}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Merch;
