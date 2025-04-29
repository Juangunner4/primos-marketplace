import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, AccountInfo, ParsedAccountData } from '@solana/web3.js';

import '../App.css';

const PRIMOS_COLLECTION_MINT = new Set<string>([
    '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb'
]);

interface NFTInfo {
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
}

const NFTGallery: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<NFTInfo[]>([]);

    useEffect(() => {
        if (!publicKey) return;

        const fetchNFTs = async () => {
            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
                });

                const filtered = tokenAccounts.value.filter(({ account }) => {
                    const amount = account.data.parsed.info.tokenAmount.uiAmount;
                    const mint = account.data.parsed.info.mint;
                    return amount > 0 && PRIMOS_COLLECTION_MINT.has(mint);
                });

                const nftData = filtered.map(({ pubkey, account }) => ({ pubkey, account }));
                setNfts(nftData);
            } catch (err) {
                console.error('Error fetching NFTs:', err);
            }
        };

        fetchNFTs();
    }, [publicKey, connection]);

    return (
        <div className="nft-gallery">
            <h2>Your Primos NFTs</h2>
            {nfts.length === 0 ? (
                <p>No Primos NFTs found in your wallet.</p>
            ) : (
                <ul className="nft-list">
                    {nfts.map((nft, i) => (
                        <li key={i}>{nft.account.data.parsed.info.mint}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NFTGallery;
