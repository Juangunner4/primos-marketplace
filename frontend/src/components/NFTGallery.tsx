import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, getCollectionStats, HeliusNFT } from '../utils/helius';
import logo from '../images/primoslogo.png'; 
import './NFTGallery.css';
import { useTranslation } from 'react-i18next';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

const NFTGallery: React.FC = () => {
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<HeliusNFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [floorPrice, setFloorPrice] = useState<number | null>(null);
    const [owners, setOwners] = useState<number | null>(null);
    const [solPrice, setSolPrice] = useState<number | null>(null);
    const { t } = useTranslation();

    // Fetch SOL price in USD
    const fetchSolPrice = async () => {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            if (!res.ok) {
                setSolPrice(null);
                return;
            }
            const data = await res.json();
            setSolPrice(data?.solana?.usd ?? null);
        } catch {
            setSolPrice(null);
        }
    };

    // Fetch floor price and owners (replace with real API if available)
    const fetchCollectionStats = async () => {
        try {
            const stats = await getCollectionStats(PRIMOS_COLLECTION_MINT);
            setFloorPrice(stats.floorPrice);
            setOwners(stats.owners);
        } catch {
            setFloorPrice(null);
            setOwners(null);
        }
    };

    useEffect(() => {
        if (!publicKey) {
            setNfts([]);
            setLoading(false);
            return;
        }
        const pub = publicKey.toBase58();

        setLoading(true);
        Promise.all([
            getAssetsByCollection(PRIMOS_COLLECTION_MINT, pub),
            fetchCollectionStats(),
            fetchSolPrice()
        ]).then(([assets]) => {
            setNfts(assets);
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

    // Calculate total value in USD
    const totalValueUSD =
        floorPrice && solPrice
            ? (nfts.length * floorPrice * solPrice).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
            : '--';

    return (
        <div className="nft-gallery">
            <div className="nft-gallery-header">
                <span className="nft-gallery-title">{t('your_primos_nfts')}</span>
                <div className="nft-gallery-stats">
                    <span>{t('floor_price')}: {floorPrice !== null ? `${floorPrice} ◎` : '--'}</span>
                    <span>{t('owners')}: {owners !== null ? owners : '--'}</span>
                    <span>{t('total_value')}: {totalValueUSD}</span>
                </div>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-300 mb-4 bg-white"></div>
                    <p className="text-gray-700 font-medium">{t('loading_nfts')}</p>
                </div>
            ) : nfts.length === 0 ? (
                <p className="text-gray-600">{t('no_nfts')}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft, i) => {
                        const variant = CARD_VARIANTS[Math.floor(Math.random() * CARD_VARIANTS.length)];
                        return (
                            <div
                                key={i}
                                className={`nft-card nft-card--${variant}`}
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
                                <div className="nft-token">
                                </div>
                                <span className="nft-status">
                                    {nft.listed ? t('listed') : t('not_listed')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NFTGallery;
