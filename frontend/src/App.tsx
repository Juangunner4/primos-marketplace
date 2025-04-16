import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import NFTGallery from './components/NFTGallery';
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);

  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ],
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

            {walletConnected ? (
              <NFTGallery />
            ) : (
              <div className="connect-msg">
                <p>Please connect your wallet to view and list NFTs.</p>
              </div>
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
