import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';

import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const PRIMOS_COLLECTION_MINT = new Set([
    '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb'
]);

const NFTGallery = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState([]);

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

                setNfts(filtered);
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

const App = () => {
    const [walletConnected, setWalletConnected] = useState(false);

    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter()],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="App">
                        <header className="header">
                            <h1>Primos Marketplace</h1>
                            <WalletMultiButton />
                            <WalletDisconnectButton />
                        </header>

                        <NFTGallery />
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;
