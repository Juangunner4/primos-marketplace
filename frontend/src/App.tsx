import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useTranslation } from 'react-i18next';

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
  const { i18n, t } = useTranslation();

  return (
    <header className="header" style={{ position: 'relative' }}>
      {/* Language buttons */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          gap: '0.5rem',
          padding: '0.5rem',
        }}
        className="lang-buttons"
      >
        <button
          onClick={() => i18n.changeLanguage('en')}
          style={{
            background: i18n.language === 'en' ? '#1a202c' : '#fff',
            color: i18n.language === 'en' ? '#fff' : '#1a202c',
            border: '1px solid #1a202c',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          EN
        </button>
        <button
          onClick={() => i18n.changeLanguage('es')}
          style={{
            background: i18n.language === 'es' ? '#1a202c' : '#fff',
            color: i18n.language === 'es' ? '#fff' : '#1a202c',
            border: '1px solid #1a202c',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ES
        </button>
      </div>
      {/* BETA */}
      <span className="beta-text">
        BETA
      </span>
      <img src={logo} alt="Left Logo" className="logo logo-left" style={{ marginLeft: '60px' }} />

      <div className="wallet-buttons">
        {publicKey && (
          <button
            onClick={() => navigate(isProfilePage ? '/' : '/profile')}
            className="wallet-adapter-button"
          >
            {isProfilePage ? t('home') : t('profile')}
          </button>
        )}
        <WalletLogin />
      </div>
    </header>
  );
};

const App = () => {
  // Switch to mainnet
  const heliusApiKey = process.env.REACT_APP_HELIUS_API_KEY || process.env.HELIUS_API_KEY;
  const endpoint = useMemo(
    () => `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
    [heliusApiKey]
  ); const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
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
