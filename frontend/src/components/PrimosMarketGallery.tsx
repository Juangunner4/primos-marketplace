import React, { useEffect, useState } from 'react';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// Use the Unstable_Grid2 component to avoid type errors in MUI v7
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

const CARD_VARIANTS = [
  { name: 'pink', bg: '#ffe4e6', border: '#ff69b4' },
  { name: 'yellow', bg: '#fffbe6', border: '#e2c275' },
  { name: 'green', bg: '#e6ffe6', border: '#2e8b57' },
  { name: 'blue', bg: '#e6f0ff', border: '#4169e1' },
  { name: 'orange', bg: '#fff0e6', border: '#ff7f50' },
];
const MAGICEDEN_SYMBOL = 'primos';

type MarketNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  owner: string;
  variant: string;
};

const PrimosMarketGallery: React.FC = () => {
  const [nfts, setNfts] = useState<MarketNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [listedCount, setListedCount] = useState<number | null>(null);
  const [uniqueHolders, setUniqueHolders] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      try {
        const [listings, stats, solPriceVal, holderStats] = await Promise.all([
          fetchMagicEdenListings(MAGICEDEN_SYMBOL),
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
          getMagicEdenHolderStats(MAGICEDEN_SYMBOL),
        ]);
        setListedCount(stats?.listedCount ?? null);
        setFloorPrice(stats?.floorPrice ? stats.floorPrice / 1e9 : null);
        setSolPrice(solPriceVal ?? null);
        setUniqueHolders(holderStats?.uniqueHolders ?? null);

        const uniqueTokenMints = Array.from(
          new Set(listings.map((l: any) => l.tokenMint))
        ) as string[];
        const metaMap: Record<string, any> = {};
        await Promise.all(
          uniqueTokenMints.map(async (mint: string) => {
            const meta = await getNFTByTokenAddress(mint);
            if (meta) metaMap[mint] = meta;
          })
        );

        const allNFTs: MarketNFT[] = listings
          .map((listing: any) => {
            const meta = metaMap[listing.tokenMint];
            return {
              id: listing.tokenMint,
              image: meta?.image || '',
              name: meta?.name || listing.tokenMint,
              price: listing.price,
              owner: listing.seller,
              variant:
                CARD_VARIANTS[
                  Math.floor(Math.random() * CARD_VARIANTS.length)
                ].name,
            };
          })
          .filter((nft: MarketNFT) => nft.image);

        if (isMounted) {
          setNfts(allNFTs);
        }
      } catch (e) {
        console.error('Failed to load market data', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  let content;
  if (loading) {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary" fontWeight={500}>
          {t('market_loading')}
        </Typography>
      </Box>
    );
  } else if (nfts.length === 0) {
    content = <Typography color="text.secondary">{t('market_no_nfts')}</Typography>;
  } else {
    content = (
      <Grid container spacing={3}>
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          return (
            <Grid item xs={12} sm={6} md={4} key={nft.id}>
              <Card
                sx={{
                  background: variant.bg,
                  border: `5px solid ${variant.border}`,
                  borderRadius: 3,
                  boxShadow: 3,
                  minHeight: 340,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
                  '&:hover': {
                    transform: 'scale(1.07) rotate(-2deg) translateY(-8px)',
                    boxShadow: 8,
                    zIndex: 10,
                  },
                }}
              >
                <Chip
                  label={nft.id.slice(0, 4)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    background: 'rgba(226, 194, 117, 0.93)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '0.07em',
                    zIndex: 3,
                    boxShadow: '0 2px 8px rgba(226, 194, 117, 0.13)',
                  }}
                  size="small"
                />
                <CardMedia
                  component="img"
                  image={nft.image}
                  alt={nft.name}
                  sx={{
                    width: '95%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: '1.2rem 1.2rem 0 0',
                    borderBottom: `5px solid ${variant.border}`,
                    background: '#fff',
                    mt: 1,
                  }}
                />
                <CardContent sx={{ flexGrow: 1, width: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="#b8860b"
                    sx={{
                      fontFamily: 'Loteria, Segoe UI, sans-serif',
                      mt: 1,
                      mb: 0.5,
                      textAlign: 'center',
                      letterSpacing: '0.13em',
                    }}
                  >
                    {nft.name}
                  </Typography>
                  {nft.price ? (
                    <>
                      <Typography fontWeight="bold" sx={{ background: '#ffe066', borderRadius: '0.7rem', px: 2, py: 0.3, mb: 1, mt: 1 }}>
                        {nft.price} ◎
                      </Typography>
                      {solPrice && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                          (${(nft.price * solPrice).toFixed(2)})
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('market_no_price')}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {t('market_owner')}: {nft.owner.slice(0, 4)}...{nft.owner.slice(-4)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, position: 'relative' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="#b8860b"
          sx={{
            letterSpacing: '0.04em',
            fontFamily: 'Loteria, Segoe UI, sans-serif',
            fontSize: { xs: '1.3rem', sm: '2.2rem' },
          }}
        >
          {t('market_title')}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('market_sol_price')}: {solPrice !== null ? `$${solPrice.toFixed(2)}` : '--'}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('market_listed')}: {listedCount ?? '--'}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('market_holders')}: {uniqueHolders ?? '--'}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('market_floor_price')}: {floorPrice !== null ? `${floorPrice} ◎` : '--'}
          </Paper>
        </Stack>
      </Stack>
      {content}
    </Box>
  );
};

export default PrimosMarketGallery;
