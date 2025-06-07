import React, { useEffect, useState } from 'react';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { useTranslation } from 'react-i18next';
import { CARD_VARIANTS, getRandomCardVariantName } from '../utils/cardVariants';
import './PrimosMarketGallery.css';
import Activity from './Activity';

const MAGICEDEN_SYMBOL = 'primos';
const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        }
      } catch (e) {
        // handle error
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
        // Fetch only the listings for the current page
        const offset = (page - 1) * PAGE_SIZE;
        const listings = await fetchMagicEdenListings(MAGICEDEN_SYMBOL, offset, PAGE_SIZE);

        // If this is the first page, also get the total count for pagination
        if (page === 1) {
          const stats = await getMagicEdenStats(MAGICEDEN_SYMBOL);
          if (stats?.listedCount) {
            setTotalPages(Math.ceil(stats.listedCount / PAGE_SIZE));
          }
        }

        // Fetch metadata for these NFTs only
        const metaMap: Record<string, any> = {};
        await Promise.all(
          listings.map(async (listing: any) => {
            const meta = await getNFTByTokenAddress(listing.tokenMint);
            if (meta) metaMap[listing.tokenMint] = meta;
          })
        );

        // Only 10 per page, assign variant using util
        const pageNFTs: MarketNFT[] = listings
          .slice(0, PAGE_SIZE)
          .map((listing: any) => {
            const meta = metaMap[listing.tokenMint];
            return {
              id: listing.tokenMint,
              image: meta?.image || '',
              name: meta?.name || listing.tokenMint,
              price: listing.price,
              owner: listing.seller,
              variant: getRandomCardVariantName(),
            };
          })
          .filter((nft: MarketNFT) => nft.image);

        if (isMounted) setNfts(pageNFTs);
      } catch (e) {
        if (isMounted) setNfts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPage();
    return () => { isMounted = false; };
  }, [page]);

  let content;
  if (loading) {
    content = (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>{t('market_loading')}</span>
      </div>
    );
  } else if (nfts.length === 0) {
    content = <p className="no-nfts">{t('market_no_nfts')}</p>;
  } else {
    content = (
      <ul className="market-nft-list nft-list">
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          const priceSol = nft.price ? nft.price.toFixed(3) : null;
          const priceUsd = nft.price && solPrice ? (nft.price * solPrice).toFixed(2) : null;
          return (
            <li key={nft.id} className={`market-card market-card--${variant.name}`}>
              <span className="market-prefix">{nft.id.slice(0, 4)}</span>
              <img src={nft.image} alt={nft.name} className="market-nft-img" />
              <div className="market-card-content">
                <h3 className="market-nft-name">{nft.name}</h3>
              </div>
              <div className="market-card-footer">
                <span className="market-nft-owner">
                  {t('market_owner')}: {nft.owner.slice(0, 4)}
                </span>
                {priceSol ? (
                  <span className="market-nft-price-pill">
                    {priceSol} SOL
                    {priceUsd && (
                      <span className="usd"> (${priceUsd})</span>
                    )}
                  </span>
                ) : (
                  <span className="market-nft-price-pill">{t('market_no_price')}</span>
                )}
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
          <h2 className="market-title">{t('market_title')}</h2>
          <div className="market-stats-pills">
            <span className="market-pill">{t('market_sol_price')}: {solPrice !== null ? `$${solPrice.toFixed(2)}` : '--'}</span>
            <span className="market-pill">{t('market_listed')}: {listedCount ?? '--'}</span>
            <span className="market-pill">{t('market_holders')}: {uniqueHolders ?? '--'}</span>
            <span className="market-pill">{t('market_floor_price')}: {floorPrice !== null ? `${floorPrice}` : '--'}</span>
          </div>
        </div>
        {content}
        <div className="market-pagination" style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ marginRight: 16, padding: '0.4rem 1.2rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc', background: page === 1 ? '#eee' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            {t('prev') || 'Prev'}
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 500 }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ marginLeft: 16, padding: '0.4rem 1.2rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc', background: page === totalPages ? '#eee' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            {t('next') || 'Next'}
          </button>
        </div>
      </div>
      <Activity />
    </div>
  );
};

export default PrimosMarketGallery;
