import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection, HeliusNFT } from '../utils/helius';
import logo from '../images/primoslogo.png'; 
import { useTranslation } from 'react-i18next';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

const NFTGallery: React.FC = () => {
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<HeliusNFT[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!publicKey) {
            setNfts([]);
            setLoading(false);
            return;
        }
        const pub = publicKey.toBase58();

        const fetchCollectionAssets = async () => {
            setLoading(true);
            try {
                const assets = await getAssetsByCollection(PRIMOS_COLLECTION_MINT, pub);
                setNfts(assets);
            } catch (err) {
                console.error('Error fetching By Collection:', err);
            }
            setLoading(false);
        };

        fetchCollectionAssets();
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

    return (
        <div className="nft-gallery">
            <h2 className="text-2xl font-bold mb-6">{t('your_primos_nfts')}</h2>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-300 mb-4 bg-white"></div>
                    <p className="text-gray-700 font-medium">{t('loading_nfts')}</p>
                </div>
            ) : nfts.length === 0 ? (
                <p className="text-gray-600">{t('no_nfts')}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-300 rounded-2xl p-4 shadow-lg text-black flex flex-col items-center"
                        >
                            <img
                                src={nft.image}
                                alt={nft.name}
                                className="rounded-xl object-cover h-48 w-full mb-4"
                            />
                            <div className="w-full">
                                <h3 className="text-lg font-semibold truncate">{nft.name}</h3>
                                <div className="text-sm mt-2">
                                    <span className="font-mono break-all block">
                                        Token: {nft.id}
                                    </span>
                                    <span
                                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                                            nft.listed
                                                ? 'bg-green-100 text-green-700 border border-green-300'
                                                : 'bg-red-100 text-red-700 border border-red-300'
                                        }`}
                                    >
                                        {nft.listed ? t('listed') : t('not_listed')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NFTGallery;
