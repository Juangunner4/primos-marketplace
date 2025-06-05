import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchNftMetadata } from '../utils/getNftMetadata';
import { getAssetsByCollection } from '../utils/helius';

const PRIMOS_COLLECTION_MINT = new Set<string>([
    '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb' // Add more mints if needed
]);

interface NFTInfo {
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
    metadata?: {
        name: string;
        image: string;
        description?: string;
    };
}

const NFTGallery: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<NFTInfo[]>([]);

    useEffect(() => {
        if (!publicKey) return;
        const pub = publicKey.toBase58();

        const fetchCollectionAssets = async (mint: string) => {
            try {
                const asset = await getAssetsByCollection(mint, pub);
                console.log('Fetched Asset:', asset);
            } catch (err) {
                console.error('Error fetching By Collection:', err);
            }
        };

        fetchCollectionAssets('2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb');

        const fetchNFTs = async () => {
            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                });
                console.log(
                    'Wallet token mints:',
                    tokenAccounts.value.map(({ account }) => account.data.parsed.info.mint)
                );

                const filtered = tokenAccounts.value.filter(({ account }) => {
                    const amount = account.data.parsed.info.tokenAmount.uiAmount;
                    const mint = account.data.parsed.info.mint;
                    return amount > 0 && PRIMOS_COLLECTION_MINT.has(mint);
                });

                const enriched: NFTInfo[] = [];

                for (const { pubkey, account } of filtered) {
                    const mint = account.data.parsed.info.mint;
                    const metadata = await fetchNftMetadata(connection, mint);
                    if (metadata !== null && metadata !== undefined) {
                        enriched.push({ pubkey, account, metadata });
                    }
                }

                setNfts(enriched);
            } catch (err) {
                console.error('Error fetching NFTs:', err);
            }
        };

        fetchNFTs();
    }, [publicKey, connection]);

    return (
        <div className="nft-gallery">
            <h2 className="text-2xl font-bold mb-6">Your Primos NFTs</h2>
            {nfts.length === 0 ? (
                <p className="text-gray-600">No Primos NFTs found in your wallet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft, i) => (
                        <Dialog.Root key={i}>
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                className="bg-black border border-gray-700 rounded-2xl p-4 shadow-lg text-white cursor-pointer"
                            >
                                <Dialog.Trigger asChild>
                                    <img
                                        src={nft.metadata?.image || '/fallback.png'}
                                        alt={nft.metadata?.name || 'NFT'}
                                        className="rounded-xl object-cover h-48 w-full"
                                    />
                                </Dialog.Trigger>
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold truncate">{nft.metadata?.name || nft.account.data.parsed.info.mint}</h3>
                                    <p className="text-primary text-sm">Owned</p>
                                </div>
                            </motion.div>

                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
                                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white p-6 rounded-xl z-50 w-[90%] max-w-md shadow-xl">
                                    <Dialog.Title className="text-2xl font-bold">{nft.metadata?.name}</Dialog.Title>
                                    <img src={nft.metadata?.image} alt="NFT Full" className="mt-4 rounded-xl" />
                                    <p className="mt-4">{nft.metadata?.description}</p>
                                    <Dialog.Close className="absolute top-2 right-4 text-white text-xl cursor-pointer">×</Dialog.Close>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NFTGallery;
