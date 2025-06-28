import React, { useEffect, useState } from 'react';
import { Card, CardActionArea, CardMedia, CardActions, Button, Typography, Box } from '@mui/material';
import * as Dialog from '@radix-ui/react-dialog';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { getNftRank } from '../utils/nft';
import { useTranslation } from 'react-i18next';
import { CARD_VARIANTS, getRandomCardVariantName } from '../utils/cardVariants';
import './PrimosMarketGallery.css';
import Activity from '../components/Activity';
import NFTCard from '../components/NFTCard';

const MAGICEDEN_SYMBOL = 'primos';
const PAGE_SIZE = 10;

type MarketNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
  attributes?: { trait_type: string; value: string }[];
};

const PrimosMarketGallery: React.FC = () => {
  const [nfts, setNfts] = useState<MarketNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [listedCount, setListedCount] = useState<number | null>(null);
  const [uniqueHolders, setUniqueHolders] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [selectedNft, setSelectedNft] = useState<MarketNFT | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const { t } = useTranslation();


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
          setUniqueHolders(holderStats?.uniqueHolders ?? null);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, []);


  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPage(page, setNfts, setLoading, setTotalPages, getNftRank).catch((e) => {
      console.error('Failed to fetch listings:', e);
      if (isMounted) setNfts([]);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [page]);

  async function fetchPage(
    page: number,
    setNfts: React.Dispatch<React.SetStateAction<MarketNFT[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setTotalPages: React.Dispatch<React.SetStateAction<number>>,
    getNftRank: (listing: any, metaAttrs: any) => number | null
  ) {
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const listings = await fetchMagicEdenListings(MAGICEDEN_SYMBOL, offset, PAGE_SIZE);

      if (page === 1) {
        const stats = await getMagicEdenStats(MAGICEDEN_SYMBOL);
        if (stats?.listedCount) {
          setTotalPages(Math.ceil(stats.listedCount / PAGE_SIZE));
        }
      }

      const pageNFTs: MarketNFT[] = await Promise.all(
        listings.map(async (listing: any) => {
          const meta = await getNFTByTokenAddress(listing.tokenMint);
          const image = listing.img ?? listing.image ?? listing.extra?.img ?? meta?.image ?? '';
          const name = listing.name ?? listing.title ?? meta?.name ?? listing.tokenMint;
          const metaAttrs = meta?.attributes;
          const rank = getNftRank(listing, metaAttrs);
          return {
            id: listing.tokenMint,
            image,
            name,
            price: listing.price,
            variant: getRandomCardVariantName(),
            rank,
            attributes: metaAttrs,
          } as MarketNFT;
        })
      );

      const filtered = pageNFTs.filter((nft) => nft.image);

      setNfts(filtered);
    } catch (e) {
      console.error('Error fetching page:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const filteredNfts = nfts;

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
      <ul className="nft-gallery-grid market-nft-list nft-list">
        {filteredNfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          const priceSol = nft.price ? nft.price.toFixed(3) : null;
          const priceUsd = nft.price && solPrice ? (nft.price * solPrice).toFixed(2) : null;

          let rankVariant = CARD_VARIANTS.find(v => v.name === 'bronze');
          if (nft.rank !== null && nft.rank <= 100) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'gold');
          } else if (nft.rank !== null && nft.rank <= 500) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'silver');
          }

          return (
            <Dialog.Root open={selectedNft?.id === nft.id && cardOpen} onOpenChange={(open) => {
              setCardOpen(open);
              if (!open) setSelectedNft(null);
            }} key={nft.id}>
              <Dialog.Trigger asChild>
                <Card>
                  <CardActionArea
                    onClick={() => {
                      setSelectedNft(nft);
                      setCardOpen(true);
                    }}
                  >
                    {/* Rank pill: top-left */}
                    <Box sx={{
                      position: 'absolute', top: 14, left: 14, zIndex: 2,
                      background: rankVariant?.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
                    }}>
                      {nft.rank !== null ? `#${nft.rank}` : '--'}
                    </Box>
                    {/* ID pill: top-right */}
                    <Box sx={{
                      position: 'absolute', top: 14, right: 14, zIndex: 2,
                      background: variant.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
                    }}>
                      {nft.id.slice(0, 4)}
                    </Box>
                    {/* NFT Image */}
                    <CardMedia
                      component="img"
                      image={nft.image}
                      alt={nft.name}
                    />
                    {/* Name pill: below image, centered */}
                    <Typography sx={{
                      position: 'absolute', bottom: -5, left: 14, zIndex: 2,
                      background: variant.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '0.85rem'
                    }}
                    >
                      {nft.name}
                    </Typography>
                  </CardActionArea>
                  <CardActions sx={{ flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {priceSol ? (
                      <Box
                        sx={{
                          background: variant.bg,
                          border: `2px solid ${variant.border}`,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          color: '#1a202c',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          justifyContent: 'center',
                          alignSelf: 'center',
                        }}
                      >
                        {priceSol} SOL
                        {priceUsd && (
                          <span style={{ fontSize: '0.92em', color: '#444', fontWeight: 500, marginLeft: '0.18em', opacity: 0.85 }}>
                            (${priceUsd})
                          </span>
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          background: variant.bg,
                          border: `2px solid ${variant.border}`,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          color: '#1a202c',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          justifyContent: 'center',
                          alignSelf: 'center',
                        }}
                      >
                        {t('market_no_price')}
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        background: variant.bg,
                        color: '#222',
                        fontWeight: 700,
                        border: `2px solid ${variant.border}`,
                        boxShadow: 'none',
                        '&:hover': {
                          background: variant.border,
                          color: '#fff',
                        },
                      }}
                    >
                      {t('buy_now')}
                    </Button>
                  </CardActions>
                </Card>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay style={{
                  background: 'rgba(0,0,0,0.55)',
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} />
              </Dialog.Portal>
            </Dialog.Root>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      {/* Overlay and NFTCard modal */}
      {cardOpen && (
        <div
          className="nft-modal-wrapper"
          style={{ zIndex: 1200 }}
        >
          <NFTCard
            nft={selectedNft}
            open={cardOpen}
            onClose={() => setCardOpen(false)}
            buyLabel={t("buy_now")}
            solPriceUsd={solPrice ?? undefined}
          />
        </div>
      )}

      {/* Main marketplace content, faded when modal is open */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          filter: cardOpen ? 'blur(2px)' : 'none',
          opacity: cardOpen ? 0.4 : 1,
          pointerEvents: cardOpen ? 'none' : 'auto',
          transition: 'opacity 0.2s, filter 0.2s',
        }}
      >
        {/* Filter Incoming */}
        {/* {!filterOpen && (
          <IconButton
            aria-label={t('open_filters')}
            onClick={() => setFilterOpen(true)}
            sx={{
              border: '1px solid #bbb',
              borderRadius: 3,
              boxShadow: '4px 0 24px rgba(226, 194, 117, 0.08)',
              background: '#f5f5f8',
              margin: '0 10px 0 10px',
            }}
          >
            <CompareArrowsIcon />
          </IconButton>
        )}
        <FilterPanel
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minRank={minRank}
          maxRank={maxRank}
          attributeGroups={attributeGroups}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={setSelectedAttributes}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          setMinRank={setMinRank}
          setMaxRank={setMaxRank}
          onClear={handleClearFilters}
          onApply={handleApplyFilters}
        /> */}
        <div className="market-gallery" style={{ flex: 1 }}>
          <div className="market-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h2 className="market-title">{t('market_title')}</h2>
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
              {t('go')}
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
      </div>
    </>
  );
};

export default PrimosMarketGallery;

