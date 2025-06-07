import React, { useEffect, useState } from 'react';
import { getPythSolPrice } from '../utils/pyth';
import { fetchMagicEdenListings, getMagicEdenStats, getMagicEdenHolderStats } from '../utils/magiceden';
import { getNFTByTokenAddress } from '../utils/helius';
import { useTranslation } from 'react-i18next';
import './PrimosMarketGallery.css';
import '../App.css';
const CARD_VARIANTS = ['pink', 'yellow', 'green', 'blue', 'orange'];
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

      // 1. Get all listings from Magic Eden
      const listings = await fetchMagicEdenListings(MAGICEDEN_SYMBOL);

      // 2. Get stats from Magic Eden
      const stats = await getMagicEdenStats(MAGICEDEN_SYMBOL);
      setListedCount(stats?.listedCount ?? null);
      setFloorPrice(stats?.floorPrice ? stats.floorPrice / 1e9 : null);

      // 3. Get SOL price from Pyth
      const solPriceVal = await getPythSolPrice();

      // 4. Get unique holders from Magic Eden holder stats
      const holderStats = await getMagicEdenHolderStats(MAGICEDEN_SYMBOL);
      setUniqueHolders(holderStats?.uniqueHolders ?? null);

      // 5. Get unique token mints from listings
      const uniqueTokenMints = Array.from(new Set(listings.map((l: any) => l.tokenMint))) as string[];

      // 6. Fetch metadata for each unique token mint
      const metaMap: Record<string, any> = {};
      await Promise.all(
        uniqueTokenMints.map(async (mint: string) => {
          const meta = await getNFTByTokenAddress(mint);
          if (meta) metaMap[mint] = meta;
        })
      );

      // 7. Merge listing info with metadata
      const allNFTs: MarketNFT[] = listings.map((listing: any) => {
        const meta = metaMap[listing.tokenMint];
        return {
          id: listing.tokenMint,
          image: meta?.image || '',
          name: meta?.name || listing.tokenMint,
          price: listing.price,
          owner: listing.seller,
          variant: CARD_VARIANTS[Math.floor(Math.random() * CARD_VARIANTS.length)],
        };
      }).filter((nft: MarketNFT) => nft.image);

      // Debug logs
      console.log('Loaded listed NFTs:', allNFTs.length);

      if (isMounted) {
        setNfts(allNFTs);
        setSolPrice(solPriceVal ?? null);
        setLoading(false);
      }
    }
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  let content;
  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-300 mb-4 bg-white"></div>
        <p className="text-gray-700 font-medium">{t('market_loading')}</p>
      </div>
    );
  } else if (nfts.length === 0) {
    content = <p className="text-gray-600">{t('market_no_nfts')}</p>;
  } else {
    content = (
      <div className="market-nft-list nft-list">
        {nfts.map(nft => (
          <div key={nft.id} className={`market-card market-card--${nft.variant}`}>
            <div className="market-card-header">
              <span className="market-prefix">{nft.id.slice(0, 4)}</span>
            </div>
            <img src={nft.image} alt={nft.name} className="market-nft-img" />
            <div className="market-nft-name">{nft.name}</div>
            <div className="market-nft-price">
              {nft.price ? (
                <>
                  {nft.price} ◎
                  {solPrice && (
                    <span style={{ marginLeft: 8, color: '#888', fontSize: '0.95em' }}>
                      (${(nft.price * solPrice).toFixed(2)})
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: '#aaa' }}>{t('market_no_price')}</span>
              )}
            </div>
            <div className="market-nft-owner">
              {t('market_owner')}: {nft.owner.slice(0, 4)}...{nft.owner.slice(-4)}
            </div>
            <div className="market-nft-owner" style={{ fontSize: '0.85em', color: '#aaa' }}>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="market-gallery">
      <div className="market-header-row">
        <div className="market-stats-pills">
          <span className="market-pill">
            {t('market_sol_price')}: {solPrice !== null ? `$${solPrice.toFixed(2)}` : '--'}
          </span>
          <span className="market-pill">
            {t('market_listed')}: {listedCount ?? '--'}
          </span>
          <span className="market-pill">
            {t('market_holders')}: {uniqueHolders ?? '--'}
          </span>
          <span className="market-pill">
            {t('market_floor_price')}: {floorPrice !== null ? `${floorPrice} ◎` : '--'}
          </span>
        </div>
        <span className="market-title">
          {t('market_title')}
        </span>
      </div>
      {content}
    </div>
  );
};

export default PrimosMarketGallery;
