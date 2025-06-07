import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, HeliusNFT } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import logo from '../images/primoslogo.png';
import { useTranslation } from 'react-i18next';
import { Slot } from '@radix-ui/react-slot';
import './NFTGallery.css';

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
          variant:
            CARD_VARIANTS[
              Math.floor(Math.random() * CARD_VARIANTS.length)
            ].name,
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
      <ul className="nft-gallery-grid">
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          return (
            <Slot asChild key={nft.id} className={`nft-card nft-card--${variant.name}`}> 
              <li>
                <span className="nft-prefix">{nft.id.slice(0, 4)}</span>
                <img src={nft.image} alt={nft.name} />
                <div className="nft-card-body">
                  <h3 className="nft-title">{nft.name}</h3>
                  <span className="nft-status">{nft.listed ? t('listed') : t('not_listed')}</span>
                </div>
              </li>
            </Slot>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="nft-gallery">
      <div className="nft-gallery-header">
        <h2 className="nft-gallery-title">{t('your_primos_nfts')}</h2>
        <div className="nft-gallery-stats">
          <span>{t('floor_price')}: {floorPrice !== null ? `${floorPrice / 1e9} ◎` : '--'}</span>
          <span>{t('owned')}: {nfts.length}</span>
          <span>{t('sol_price')}: {solPrice !== null ? `$${solPrice}` : '--'}</span>
          <span>{t('total_value')}: {totalValueUSD}</span>
        </div>
      </div>
      {galleryContent}
    </div>
  );
};

export default NFTGallery;
