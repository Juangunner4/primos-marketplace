import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import primos from './images/primoslogo.png';
import logo from './images/primosheadlogo.png';
import NFTGallery from './components/NFTGallery';
import WalletLogin from './components/WalletLogin';
import UserProfile from './components/UserProfile';

import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Move Header inside App so it's in Router context
const Header: React.FC = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

  return (
    <header className="header">
      <img src={primos} alt="Left Logo" className="logo logo-left" />

      <div className="logo-center-container">
        <img src={logo} alt="Center Logo" className="logo logo-center" />
      </div>

      <div className="wallet-buttons">
        {publicKey && (
          <button
            onClick={() => navigate(isProfilePage ? '/' : '/profile')}
            className="wallet-adapter-button"
          >
            {isProfilePage ? 'Home' : 'Profile'}
          </button>
        )}
        <WalletLogin />
      </div>
    </header>
  );
};

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            {/* Header must be inside Router context */}
            <Header />
            <Routes>
              <Route path="/" element={<NFTGallery />} />
              <Route path="/profile" element={<UserProfile />} />
            </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
