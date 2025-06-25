import React, { useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import api from './utils/api';

import logo from './images/primosheadlogo.png';
import NFTGallery from './pages/NFTGallery';
import WalletLogin from './components/WalletLogin';
import UserProfile from './pages/UserProfile';
import SidebarNav from './components/SidebarNav';
import PrimosMarketGallery from './pages/PrimosMarketGallery';
import Home from './pages/Home';
import PrimoLabs from './pages/PrimoLabs';
import Primos from './pages/Primos';
import Docs from './pages/Docs';
import Admin from './pages/Admin';
import BetaRedeem from './components/BetaRedeem';
import LoadingOverlay from './components/LoadingOverlay';

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';
import { PrimoHolderProvider, usePrimoHolder } from './contexts/PrimoHolderContext';
import { getNFTByTokenAddress } from './utils/helius';

import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// LanguageButtons extracted to reduce complexity
const LanguageButtons: React.FC = () => {
  const { i18n } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant={i18n.language === 'en' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => i18n.changeLanguage('en')}
        sx={{
          minWidth: 28,
          height: 26,
          fontSize: '0.75rem',
          px: 1,
          py: 0,
          background: i18n.language === 'en' ? '#111' : '#fff',
          color: i18n.language === 'en' ? '#fff' : '#111',
          borderColor: '#111',
          '&:hover': {
            background: i18n.language === 'en' ? '#222' : '#f0f0f0',
            color: i18n.language === 'en' ? '#e2e8f0' : '#111',
          },
        }}
      >
        EN
      </Button>
      <Button
        variant={i18n.language === 'es' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => i18n.changeLanguage('es')}
        sx={{
          minWidth: 28,
          height: 26,
          fontSize: '0.75rem',
          px: 1,
          py: 0,
          background: i18n.language === 'es' ? '#111' : '#fff',
          color: i18n.language === 'es' ? '#fff' : '#111',
          borderColor: '#111',
          '&:hover': {
            background: i18n.language === 'es' ? '#222' : '#f0f0f0',
            color: i18n.language === 'es' ? '#e2e8f0' : '#111',
          },
        }}
      >
        ES
      </Button>
    </Box>
  );
};

const Header: React.FC = () => {
  const { publicKey } = useWallet();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

  const [pfpImage, setPfpImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPfp = async () => {
      if (!publicKey) {
        setPfpImage(null);
        return;
      }
      try {
        const res = await api.get(`/api/user/${publicKey.toBase58()}`, {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        });
        const token = res.data?.pfp;
        if (token) {
          const nft = await getNFTByTokenAddress(token.replace(/"/g, ''));
          setPfpImage(nft?.image ?? null);
        } else {
          setPfpImage(null);
        }
      } catch {
        setPfpImage(null);
      }
    };
    fetchPfp();
  }, [publicKey]);

  const renderProfileButtonContent = () => {
    if (isProfilePage) {
      return t('home');
    } else if (pfpImage) {
      return <Avatar src={pfpImage} />;
    } else {
      return t('profile');
    }
  };

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'flex-start',
            position: 'absolute',
            left: 5,
            top: 10,
            zIndex: 10,
          }}
        >
          <LanguageButtons />
        </Box>
        <span className="beta-text">{t('beta')}</span>
        <Box sx={{ ml: 8 }}>
          <img src={logo} alt={t('logo_alt')} className="logo logo-left logo-float" style={{ marginLeft: '60px', height: 48 }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {publicKey && (
            <Button
              variant="contained"
              onClick={() => navigate(isProfilePage ? '/' : '/profile')}
              sx={{
                background: isProfilePage ? '#e2e8f0' : '#111',
                color: isProfilePage ? '#111' : '#e2e8f0',
                border: '1px solid #111',
                '&:hover': {
                  background: isProfilePage ? '#222' : '#f0f0f0',
                  color: isProfilePage ? '#e2e8f0' : '#111',
                },
                ml: 1,
                minWidth: isProfilePage ? undefined : 40,
                padding: isProfilePage ? undefined : 0,
              }}
            >
              {renderProfileButtonContent()}
            </Button>
          )}
          <WalletLogin />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const AppRoutes = () => {
  const { publicKey } = useWallet();
  const { isHolder, betaRedeemed, userExists } = usePrimoHolder();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      (!publicKey || (!isHolder && !betaRedeemed)) &&
      (location.pathname === '/profile' || location.pathname.startsWith('/user'))
    ) {
      navigate('/', { replace: true });
    }
    if ((!publicKey || (!isHolder && !betaRedeemed)) && location.pathname === '/collected') {
      navigate('/', { replace: true });
    }
    if ((!publicKey || (!isHolder && !betaRedeemed)) && location.pathname === '/labs') {
      navigate('/', { replace: true });
    }
    if ((!publicKey || (!isHolder && !betaRedeemed)) && location.pathname === '/primos') {
      navigate('/', { replace: true });
    }
    if (
      (!publicKey || publicKey.toBase58() !== ADMIN_WALLET) &&
      location.pathname === '/admin'
    ) {
      navigate('/', { replace: true });
    }
    if ((!publicKey || (!isHolder && !betaRedeemed)) && location.pathname === '/profile') {
      navigate('/', { replace: true });
    }
    if ((!publicKey || (!isHolder && !betaRedeemed)) && location.pathname.startsWith('/user')) {
      navigate('/', { replace: true });
    }
  }, [publicKey, isHolder, betaRedeemed, location.pathname, navigate]);

  return (
    <Box sx={{ display: 'flex' }}>
      <SidebarNav />
      {/* auto‐open if userExists===false */}
      <BetaRedeem autoOpen={!userExists} />

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<PrimosMarketGallery />} />
          <Route path="/docs" element={<Docs />} />

          {publicKey && (isHolder || betaRedeemed) && userExists && (
            <>
              <Route path="/collected" element={<NFTGallery />} />
              <Route path="/labs"      element={<PrimoLabs />} />
              <Route path="/primos"    element={<Primos />} />
              <Route path="/profile"   element={<UserProfile />} />
              <Route path="/user/:publicKey" element={<UserProfile />} />
            </>
          )}

          {publicKey?.toBase58() === ADMIN_WALLET && (
            <Route path="/admin" element={<Admin />} />
          )}
        </Routes>
      </Box>
    </Box>
  );
};

const AppContent = () => {
  const { loading } = usePrimoHolder();
  const { t } = useTranslation();
  return (
    <>
      {loading && <LoadingOverlay message={t('checking_access')} />}
      <Router>
        <Header />
        <AppRoutes />
      </Router>
    </>
  );
};

const App = () => {
  const heliusApiKey = process.env.REACT_APP_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;
  const endpoint = useMemo(
    () => `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
    [heliusApiKey]
  );
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <PrimoHolderProvider>
            <AppContent />
          </PrimoHolderProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
