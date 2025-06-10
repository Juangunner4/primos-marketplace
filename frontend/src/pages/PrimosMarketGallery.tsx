import React, { useEffect, useState, useMemo } from 'react';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { useTranslation } from 'react-i18next';
import { CARD_VARIANTS, getRandomCardVariantName } from '../utils/cardVariants';
import { getRankColor } from '../utils/rank';
import './PrimosMarketGallery.css';
import Activity from '../components/Activity';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const MAGICEDEN_SYMBOL = 'primos';
const PAGE_SIZE = 10;

type MarketNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
};

const PrimosMarketGallery: React.FC = () => {
  const [nfts, setNfts] = useState<MarketNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [listedCount, setListedCount] = useState<number | null>(null);
  const [uniqueHolders, setUniqueHolders] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  const { t } = useTranslation();


  // Fetch stats and SOL price once
  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const [stats, solPriceVal, holderStats] = await Promise.all([
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
          getMagicEdenHolderStats(MAGICEDEN_SYMBOL),
        ]);
        if (isMounted) {
          setListedCount(stats?.listedCount ?? null);
          setFloorPrice(stats?.floorPrice ? stats.floorPrice / 1e9 : null);
          setSolPrice(solPriceVal ?? null);
          setUniqueHolders(holderStats?.uniqueHolders ?? null);
          setTotalSupply(holderStats?.totalSupply ?? null);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Fetch listings for current page
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchPage() {
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const listings = await fetchMagicEdenListings(MAGICEDEN_SYMBOL, offset, PAGE_SIZE);

        if (page === 1) {
          const stats = await getMagicEdenStats(MAGICEDEN_SYMBOL);
          if (stats?.listedCount) {
            setTotalPages(Math.ceil(stats.listedCount / PAGE_SIZE));
          }
        }

        function getNftRank(listing: any, metaAttrs: any): number | null {
          if (typeof listing.rarityRank === 'number') {
            return listing.rarityRank;
          }
          if (typeof listing.rank === 'number') {
            return listing.rank;
          }
          if (metaAttrs) {
            const attr = metaAttrs.find(
              (a: any) =>
                a.trait_type?.toLowerCase() === 'rank' ||
                a.trait_type?.toLowerCase() === 'rarity rank'
            );
            if (attr && !isNaN(Number(attr.value))) {
              return Number(attr.value);
            }
          }
          return null;
        }
        
        // Build NFT objects using listing data and fetch metadata only when missing
        const pageNFTs: MarketNFT[] = await Promise.all(
          listings.map(async (listing: any) => {
            let image = listing.img ?? listing.image ?? listing.extra?.img;
            let name = listing.name ?? listing.title;
            let meta: any = null;
            if (!image || !name) {
              meta = await getNFTByTokenAddress(listing.tokenMint);
              image = image ?? meta?.image;
              name = name ?? meta?.name;
            }
            const metaAttrs = meta?.attributes;
            const rank = getNftRank(listing, metaAttrs);
            return {
              id: listing.tokenMint,
              image: image || '',
              name: name || listing.tokenMint,
              price: listing.price,
              variant: getRandomCardVariantName(),
              rank,
            } as MarketNFT;
          })
        );

        const filtered = pageNFTs.filter((nft) => nft.image);

        if (isMounted) setNfts(filtered);
      } catch (e) {
        if (isMounted) setNfts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPage();
    return () => { isMounted = false; };
  }, [page]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const filteredNfts = useMemo(() => {
    return nfts.filter((nft) => {
      if (minPrice && nft.price < parseFloat(minPrice)) return false;
      if (maxPrice && nft.price > parseFloat(maxPrice)) return false;
      if (minRank && (nft.rank === null || nft.rank < parseInt(minRank, 10))) return false;
      if (maxRank && (nft.rank === null || nft.rank > parseInt(maxRank, 10))) return false;
      return true;
    });
  }, [nfts, minPrice, maxPrice, minRank, maxRank]);

  let content;
  if (loading) {
    content = (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>{t('market_loading')}</span>
      </div>
    );
  } else if (filteredNfts.length === 0) {
    content = <p className="no-nfts">{t('market_no_nfts')}</p>;
  } else {
    content = (
      <ul className="market-nft-list nft-list">
        {filteredNfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          const priceSol = nft.price ? nft.price.toFixed(3) : null;
          const priceUsd = nft.price && solPrice ? (nft.price * solPrice).toFixed(2) : null;
          return (
            <li key={nft.id} className={`market-card market-card--${variant.name}`}>
              <span className="market-prefix market-primo-number">{nft.name}</span>
              <span
                className="market-prefix market-rarity-rank"
                style={{ color: getRankColor(nft.rank, totalSupply) }}
              >
                {t('rarity_rank')}: {nft.rank ?? '--'}
              </span>
              <img src={nft.image} alt={nft.name} className="market-nft-img" />
              <div className="market-card-content">
              </div>
              <div className="market-card-footer">
                {priceSol ? (
                  <span className="market-nft-price-pill" style={{ background: variant.bg, borderColor: variant.border }}>
                    {priceSol} SOL
                    {priceUsd && (
                      <span className="usd"> (${priceUsd})</span>
                    )}
                  </span>
                ) : (
                  <span className="market-nft-price-pill" style={{ background: variant.bg, borderColor: variant.border }}>{t('market_no_price')}</span>
                )}
                <button className="buy-button">Buy Now</button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div className="market-gallery" style={{ flex: 1 }}>
        <div className="market-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h2 className="market-title">{t('market_title')}</h2>
            <IconButton
              aria-label={t('open_filters')}
              onClick={() => setFilterOpen(true)}
              sx={{ color: '#555' }}
            >
              <CompareArrowsIcon />
            </IconButton>
          </div>
          <div className="market-stats-pills">
            <span className="market-pill">{t('market_sol_price')}: {solPrice !== null ? `$${solPrice.toFixed(2)}` : '--'}</span>
            <span className="market-pill">{t('market_listed')}: {listedCount ?? '--'}</span>
            <span className="market-pill">{t('market_holders')}: {uniqueHolders ?? '--'}</span>
            <span className="market-pill">{t('market_floor_price')}: {floorPrice !== null ? `${floorPrice}` : '--'}</span>
          </div>
        </div>
        {content}
        <div className="market-pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '0.4rem 1.2rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc', background: page === 1 ? '#eee' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            {t('prev') || 'Prev'}
          </button>
          <span style={{ fontWeight: 500 }}>{page} / {totalPages}</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            style={{ width: 60, padding: '0.3rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            onClick={() => {
              const num = Math.max(1, Math.min(totalPages, parseInt(pageInput, 10) || 1));
              setPage(num);
            }}
            style={{ padding: '0.4rem 0.8rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
          >
            Go
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '0.4rem 1.2rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc', background: page === totalPages ? '#eee' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            {t('next') || 'Next'}
          </button>
        </div>
      </div>
      <Activity />
      <Drawer
        anchor="left"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ [`& .MuiDrawer-paper`]: { width: 260, boxSizing: 'border-box' } }}
      >
        <Box className="filter-panel">
          <Typography variant="h6" component="h3" className="filter-title">
            {t('filters')}
          </Typography>
          <Box className="filter-group">
            <Typography variant="subtitle2">{t('filter_price')}</Typography>
            <TextField
              type="number"
              label="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              type="number"
              label="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
          <Box className="filter-group">
            <Typography variant="subtitle2">{t('filter_rank')}</Typography>
            <TextField
              type="number"
              label="Min"
              value={minRank}
              onChange={(e) => setMinRank(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              type="number"
              label="Max"
              value={maxRank}
              onChange={(e) => setMaxRank(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
          <Box className="filter-actions">
            <Button
              variant="contained"
              onClick={() => setFilterOpen(false)}
              sx={{ mr: 1 }}
            >
              {t('apply_filters')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setMinRank('');
                setMaxRank('');
              }}
            >
              {t('clear_filters')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </div>
  );
};

export default PrimosMarketGallery;

