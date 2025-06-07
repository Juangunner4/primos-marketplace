import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, HeliusNFT } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import logo from '../images/primoslogo.png';
import { useTranslation } from 'react-i18next';
import { CARD_VARIANTS, getRandomCardVariantName } from '../utils/cardVariants';
import './PrimosMarketGallery.css'; // Use only the unified CSS

interface GalleryNFT extends HeliusNFT {
  variant: string;
}

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';
const MAGICEDEN_SYMBOL = 'primos';

const NFTGallery: React.FC = () => {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<GalleryNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setNfts([]);
        setLoading(false);
        setFloorPrice(null);
        setSolPrice(null);
        return;
      }
      const pub = publicKey.toBase58();
      setLoading(true);
      try {
        const [assets, stats, solPriceVal] = await Promise.all([
          getAssetsByCollection(PRIMOS_COLLECTION_MINT, pub),
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
        ]);
        const assetsWithVariants = assets.map((nft) => ({
          ...nft,
          variant: getRandomCardVariantName(),
        }));
        setNfts(assetsWithVariants);
        setFloorPrice(stats?.floorPrice ?? null);
        setSolPrice(solPriceVal ?? null);
      } catch (e) {
        console.error('Failed to load NFTs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="nft-connect-wrapper">
        <img src={logo} alt="Primos Logo" className="nft-logo" />
        <p className="connect-text">{t('connect_wallet')}</p>
      </div>
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
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>{t('loading_nfts')}</span>
      </div>
    );
  } else if (nfts.length === 0) {
    galleryContent = <p className="no-nfts">{t('no_nfts')}</p>;
  } else {
    galleryContent = (
      <ul className="nft-gallery-grid market-nft-list nft-list">
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          return (
            <li key={nft.id} className={`market-card market-card--${variant.name}`}>
              <span className="market-prefix">{nft.id.slice(0, 4)}</span>
              <img src={nft.image} alt={nft.name} className="market-nft-img" />
              <div className="market-card-content">
                <h3 className="market-nft-name">{nft.name}</h3>
                <span className="market-nft-price">{nft.listed ? t('listed') : t('not_listed')}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className=" market-gallery">
      <div className="market-header-row">
        <h2 className="market-title">{t('your_primos_nfts')}</h2>
        <div className="nft-gallery-stats market-stats-pills">
          <span className="market-pill">{t('floor_price')}: {floorPrice !== null ? `${floorPrice / 1e9} ◎` : '--'}</span>
          <span className="market-pill">{t('owned')}: {nfts.length}</span>
          <span className="market-pill">{t('sol_price')}: {solPrice !== null ? `$${solPrice}` : '--'}</span>
          <span className="market-pill">{t('total_value')}: {totalValueUSD}</span>
        </div>
      </div>
      {galleryContent}
    </div>
  );
};

export default NFTGallery;
