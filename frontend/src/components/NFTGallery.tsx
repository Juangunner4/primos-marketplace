import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, HeliusNFT } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import logo from '../images/primoslogo.png';
import { useTranslation } from 'react-i18next';

// Material UI imports
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';
const MAGICEDEN_SYMBOL = 'primos';

const CARD_VARIANTS = [
  { name: 'pink', bg: '#ffe4e6', border: '#ff69b4' },
  { name: 'yellow', bg: '#fffbe6', border: '#e2c275' },
  { name: 'green', bg: '#e6ffe6', border: '#2e8b57' },
  { name: 'blue', bg: '#e6f0ff', border: '#4169e1' },
  { name: 'orange', bg: '#fff0e6', border: '#ff7f50' },
];

type GalleryNFT = HeliusNFT & { variant: string };

const NFTGallery: React.FC = () => {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<GalleryNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!publicKey) {
      setNfts([]);
      setLoading(false);
      setFloorPrice(null);
      setSolPrice(null);
      return;
    }
    const pub = publicKey.toBase58();

    setLoading(true);
    Promise.all([
      getAssetsByCollection(PRIMOS_COLLECTION_MINT, pub),
      getMagicEdenStats(MAGICEDEN_SYMBOL),
      getPythSolPrice()
    ]).then(([assets, stats, solPrice]) => {
      // Assign a random variant to each NFT ONCE
      const assetsWithVariants = assets.map(nft => ({
        ...nft,
        variant: CARD_VARIANTS[Math.floor(Math.random() * CARD_VARIANTS.length)].name
      }));
      setNfts(assetsWithVariants);
      setFloorPrice(stats?.floorPrice ?? null);
      setSolPrice(solPrice ?? null);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [publicKey]);

  if (!publicKey) {
    return (
      <Box
        minHeight="70vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        sx={{ background: '#000' }}
      >
        <Box
          component="img"
          src={logo}
          alt="Primos Logo"
          sx={{
            width: 320,
            maxWidth: '80vw',
            opacity: 0.12,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box position="relative" zIndex={1}>
          <Typography variant="h5" fontWeight="bold" align="center" mb={6}>
            {t('connect_wallet')}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Calculate total value in USD (if you have solPrice)
  const totalValueUSD =
    floorPrice && solPrice
      ? (nfts.length * (floorPrice / 1e9) * solPrice).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
      : '--';

  let galleryContent;
  if (loading) {
    galleryContent = (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary" fontWeight={500}>
          {t('loading_nfts')}
        </Typography>
      </Box>
    );
  } else if (nfts.length === 0) {
    galleryContent = (
      <Typography color="text.secondary">{t('no_nfts')}</Typography>
    );
  } else {
    galleryContent = (
      <Grid container spacing={3}>
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find(v => v.name === nft.variant) || CARD_VARIANTS[0];
          return (
            <Grid item xs={12} sm={6} md={4} key={nft.id}>
              <Card
                sx={{
                  background: variant.bg,
                  border: `5px solid ${variant.border}`,
                  borderRadius: 3,
                  boxShadow: 3,
                  height: 340,
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
                    fontFamily: 'Segoe UI, sans-serif',
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

                  <Chip
                    label={nft.listed ? t('listed') : t('not_listed')}
                    sx={{
                      fontSize: '0.85rem',
                      borderRadius: '0.7rem',
                      px: 2,
                      mb: 1,
                      background: variant.border,
                      color: '#fff',
                      fontWeight: 700,
                      mt: 0.5,
                    }}
                    size="small"
                  />
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
          {t('your_primos_nfts')}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('floor_price')}: {floorPrice !== null ? `${floorPrice / 1e9} ◎` : '--'}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('owned')}: {nfts.length}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('sol_price')}: {solPrice !== null ? `$${solPrice}` : '--'}
          </Paper>
          <Paper elevation={1} sx={{ px: 2, py: 1, bgcolor: '#fffbe6', border: '2px solid #e2c275', color: '#b8860b', fontWeight: 'bold' }}>
            {t('total_value')}: {totalValueUSD}
          </Paper>
        </Stack>
      </Stack>
      {galleryContent}
    </Box>
  );
};

export default NFTGallery;
