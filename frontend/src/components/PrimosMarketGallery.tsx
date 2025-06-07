import React, { useEffect, useState } from 'react';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { useTranslation } from 'react-i18next';
import { Slot } from '@radix-ui/react-slot';
import './PrimosMarketGallery.css';

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
    <div className="market-gallery">
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
    </div>
  );
};

export default PrimosMarketGallery;
