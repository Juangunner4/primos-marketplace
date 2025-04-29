import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import primos from './images/primoslogo.png';
import logo from './images/primosheadlogo.png';
import NFTGallery from './components/NFTGallery';
import WalletLogin from './components/WalletLogin';

import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <header className="header">
              <img src={primos} alt="Left Logo" className="logo logo-left" />

              <div className="logo-center-container">
                <img src={logo} alt="Center Logo" className="logo logo-center" />
              </div>

              <div className="wallet-buttons">
                <WalletLogin />
              </div>
            </header>

            <NFTGallery />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
