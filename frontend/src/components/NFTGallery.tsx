import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, HeliusNFT } from '../utils/helius';
import { getMagicEdenStats } from '../utils/magiceden';
import { getPythSolPrice } from '../utils/pyth';
import logo from '../images/primoslogo.png';
import './NFTGallery.css';
import { useTranslation } from 'react-i18next';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';
const MAGICEDEN_SYMBOL = 'primos';

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
                variant: CARD_VARIANTS[Math.floor(Math.random() * CARD_VARIANTS.length)]
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
            <div
                style={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                    position: 'relative',
                }}
            >
                <img
                    src={logo}
                    alt="Primos Logo"
                    style={{
                        width: '320px',
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
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 className="text-2xl font-bold mb-6 text-center">{t('connect_wallet')}</h2>
                </div>
            </div>
        );
    }

    const CARD_VARIANTS = ['pink', 'yellow', 'green', 'blue', 'orange'];

    // Cards are now straight (no rotation/translation)
    const getCardStyle = () => ({});

    // Calculate total value in USD (if you have solPrice)
    const totalValueUSD =
        floorPrice && solPrice
            ? (nfts.length * (floorPrice / 1e9) * solPrice).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
            : '--';

    // Extract gallery content into a variable to avoid nested ternary in JSX
    let galleryContent;
    if (loading) {
        galleryContent = (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-300 mb-4 bg-white"></div>
                <p className="text-gray-700 font-medium">{t('loading_nfts')}</p>
            </div>
        );
    } else if (nfts.length === 0) {
        galleryContent = (
            <p className="text-gray-600">{t('no_nfts')}</p>
        );
    } else {
        galleryContent = (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                    <div
                        key={nft.id}
                        className={`nft-card nft-card--${nft.variant}`}
                        style={getCardStyle()}
                    >
                        <span className="nft-prefix">
                            {nft.id.slice(0, 4)}
                        </span>
                        <img
                            src={nft.image}
                            alt={nft.name}
                        />
                        <div className="nft-title">{nft.name}</div>
                        <div className="nft-token"></div>
                        <span className="nft-status">
                            {nft.listed ? t('listed') : t('not_listed')}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="nft-gallery">
            <div className="nft-gallery-header">
                <span className="nft-gallery-title">{t('your_primos_nfts')}</span>
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
