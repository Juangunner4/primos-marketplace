import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Card, CardActionArea, CardMedia, CardActions, Button, Typography, Box } from '@mui/material';
import * as Dialog from '@radix-ui/react-dialog';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats, getCollectionAttributes } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { getNftRank } from '../utils/nft';
import { useTranslation } from 'react-i18next';
import { CARD_VARIANTS, getRandomCardVariantName } from '../utils/cardVariants';
import './PrimosMarketGallery.css';
import Activity from '../components/Activity';
import NFTCard from '../components/NFTCard';
import GallerySettings from '../components/GallerySettings';
import FilterPanel from '../components/Filter';
import { executeBuyNow } from '../utils/transaction';
import MessageModal from '../components/MessageModal';
import { AppMessage } from '../types';
import { calculateFees } from '../utils/fees';

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
  tokenAta?: string;
  seller?: string;
  auctionHouse?: string;
  sellerReferral?: string;
  sellerExpiry?: number;
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
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  const [attributeGroups, setAttributeGroups] = useState<Record<string, string[]>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, Set<string>>>({});
  const [view, setView] = useState<'grid9' | 'grid4' | 'list'>('list');
  const { t } = useTranslation();
  const { connection } = useConnection();
  const wallet = useWallet();

  const handleBuy = async (nft: MarketNFT) => {
    try {
      await executeBuyNow(connection, wallet, {
        tokenMint: nft.id,
        tokenAta: nft.tokenAta!,
        seller: nft.seller!,
        price: nft.price,
        auctionHouse: nft.auctionHouse!,
        sellerReferral: nft.sellerReferral,
        sellerExpiry: nft.sellerExpiry,
      });
      setMessage({ text: t('tx_success'), type: 'success' });
    } catch (e) {
      console.error('Buy now failed', e);
      setMessage({ text: t('tx_failed'), type: 'error' });
    }
  };

  const handleClearFilters = () => {
    setSelectedAttributes({});
    setMinPrice('');
    setMaxPrice('');
    setMinRank('');
    setMaxRank('');
  };

  const handleApplyFilters = () => {
    // filtering happens reactively via state; no further action needed
  };


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
    async function fetchAttrs() {
      try {
        const data = await getCollectionAttributes(MAGICEDEN_SYMBOL);
        if (data?.attributes) {
          const groups: Record<string, string[]> = {};
          for (const [key, arr] of Object.entries<any>(data.attributes)) {
            groups[key] = Array.isArray(arr) ? arr.map((a: any) => a.value) : [];
          }
          setAttributeGroups(groups);
        }
      } catch (e) {
        console.error('Failed to fetch attributes', e);
      }
    }
    fetchAttrs();
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
            tokenAta: listing.tokenAddress,
            seller: listing.seller,
            auctionHouse: listing.auctionHouse,
            sellerReferral: listing.sellerReferral,
            sellerExpiry: listing.expiry,
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

  const filteredNfts = nfts.filter(nft => {
    if (minPrice && nft.price < parseFloat(minPrice)) return false;
    if (maxPrice && nft.price > parseFloat(maxPrice)) return false;
    if (minRank && (nft.rank === null || nft.rank < parseInt(minRank))) return false;
    if (maxRank && (nft.rank === null || nft.rank > parseInt(maxRank))) return false;
    for (const [group, values] of Object.entries(selectedAttributes)) {
      if (values.size === 0) continue;
      const attr = nft.attributes?.find(a => a.trait_type === group)?.value;
      if (!attr || !values.has(attr)) return false;
    }
    return true;
  });

  const renderNft = (nft: MarketNFT) => {
    const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
    const priceSol = nft.price ? nft.price.toFixed(3) : null;
    const priceUsd = nft.price && solPrice ? (nft.price * solPrice).toFixed(2) : null;
    const feeDetails = nft.price ? calculateFees(nft.price) : null;
    const totalPrice = feeDetails ? (nft.price + feeDetails.totalFees).toFixed(3) : priceSol;

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
        <Card>
          <Dialog.Trigger asChild>
            <CardActionArea
              onClick={() => {
                setSelectedNft(nft);
                setCardOpen(true);
              }}
            >
              <Box sx={{
                position: 'absolute', top: 14, left: 14, zIndex: 2,
                background: rankVariant?.bg,
                borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
              }}>
                {nft.rank !== null ? `#${nft.rank}` : '--'}
              </Box>
              <Box sx={{
                position: 'absolute', top: 14, right: 14, zIndex: 2,
                background: variant.bg,
                borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
              }}>
                {nft.id.slice(0, 4)}
              </Box>
              <CardMedia component="img" image={nft.image} alt={nft.name} />
              <Typography sx={{
                position: 'absolute', bottom: -5, left: 14, zIndex: 2,
                background: variant.bg,
                borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '0.85rem'
              }}>
                {nft.name}
              </Typography>
            </CardActionArea>
          </Dialog.Trigger>
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
                {totalPrice} SOL
                {priceUsd && (
                  <span style={{ fontSize: '0.92em', color: '#444', fontWeight: 500, marginLeft: '0.18em', opacity: 0.85 }}>
                    (${priceUsd})
                  </span>
                )}
                <div className="fee-details">
                  <span>{t('list_price')}: {priceSol} SOL</span>
                  <span>{t('market_taker_fee')} (2%): {feeDetails?.marketTaker.toFixed(4)} SOL</span>
                  <span>{t('creator_royalty_fee')} (5%): {feeDetails?.creatorRoyalty.toFixed(4)} SOL</span>
                  <span>{t('community_fee')} (3%): {feeDetails?.community.toFixed(4)} SOL</span>
                  <span>{t('operations_fee')} (1.5%): {feeDetails?.operations.toFixed(4)} SOL</span>
                </div>
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
              onClick={(e) => { e.stopPropagation(); handleBuy(nft); }}
            >
              {t('buy_now')}
            </Button>
          </CardActions>
        </Card>
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
  };

  let displayNfts = filteredNfts;
  if (view === 'grid4') displayNfts = filteredNfts.slice(0, 4);
  if (view === 'grid9') displayNfts = filteredNfts.slice(0, 9);
  if (view === 'list') displayNfts = filteredNfts.slice(0, 10);

  let content;
  if (loading) {
    content = (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>{t('market_loading')}</span>
      </div>
    );
  } else if (displayNfts.length === 0) {
    content = <p className="no-nfts">{t('market_no_nfts')}</p>;
  } else if (view === 'list') {
    content = (
      <div>
        <ul className="nft-gallery-grid market-nft-list nft-list gallery-list">
          {displayNfts.slice(0, 5).map(renderNft)}
        </ul>
        <ul className="nft-gallery-grid market-nft-list nft-list gallery-list" style={{ marginTop: '1rem' }}>
          {displayNfts.slice(5, 10).map(renderNft)}
        </ul>
      </div>
    );
  } else {
    const gridClass = view === 'grid9' ? 'gallery-grid9' : 'gallery-grid4';
    content = (
      <ul className={`nft-gallery-grid market-nft-list nft-list ${gridClass}`}>
        {displayNfts.map(renderNft)}
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
            onBuy={() => selectedNft && handleBuy(selectedNft)}
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
        <div className="market-gallery" style={{ flex: 1 }}>
          <GallerySettings
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
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
            view={view}
            onViewChange={setView}
          />
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
    <MessageModal
      open={!!message}
      message={message}
      onClose={() => setMessage(null)}
    />
  </>
  );
};

export default PrimosMarketGallery;

