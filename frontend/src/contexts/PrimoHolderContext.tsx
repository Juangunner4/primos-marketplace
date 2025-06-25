import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import { checkPrimoHolder } from '../utils/helius';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

export const PrimoHolderContext = React.createContext<{
  isHolder: boolean;
  setIsHolder: (v: boolean) => void;
  betaRedeemed: boolean;
  setBetaRedeemed: (v: boolean) => void;
  loading: boolean;
  showRedeemDialog: boolean;
  setShowRedeemDialog: (v: boolean) => void;
  redeemBetaCode: (code: string) => Promise<void>;
}>({
  isHolder: false,
  setIsHolder: () => {},
  betaRedeemed: false,
  setBetaRedeemed: () => {},
  loading: true,
  showRedeemDialog: false,
  setShowRedeemDialog: () => {},
  redeemBetaCode: async () => {},
});

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = React.useState(false);
  const [betaRedeemed, setBetaRedeemed] = React.useState(
    localStorage.getItem('betaRedeemed') === 'true'
  );
  const [loading, setLoading] = React.useState(true);
  const [showRedeemDialog, setShowRedeemDialog] = React.useState(false);

  useEffect(() => {
    const loginAndCheckHolder = async () => {
      setLoading(true);
      if (!publicKey) {
        setIsHolder(false);
        setLoading(false);
        return;
      }
      try {
        // Manage local storage for wallet change
        const currentWallet = publicKey.toBase58();
        const storedWallet = localStorage.getItem('betaWallet');
        if (storedWallet !== currentWallet) {
          localStorage.removeItem('betaRedeemed');
          localStorage.removeItem('betaCode');
          localStorage.setItem('betaWallet', currentWallet);
        }
        // Check if user owns a Primo NFT
        const holder = await checkPrimoHolder(PRIMO_COLLECTION, currentWallet);
        setIsHolder(holder);
        const redeemed = localStorage.getItem('betaRedeemed') === 'true';
        if (redeemed) {
          // Perform login for returning user
          await api.post('/api/user/login', { publicKey: currentWallet, primoHolder: holder });
          setBetaRedeemed(true);
        } else {
          // Prompt for beta code to complete login
          setShowRedeemDialog(true);
        }
      } catch (e) {
        console.error('Failed during holder check or login:', e);
        setIsHolder(false);
        setBetaRedeemed(false);
      } finally {
        setLoading(false);
      }
    };
    loginAndCheckHolder();
  }, [publicKey]);

  // Redeem beta code and login
  const redeemBetaCode = async (code: string) => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const currentWallet = publicKey.toBase58();
      const holder = await checkPrimoHolder(PRIMO_COLLECTION, currentWallet);
      setIsHolder(holder);
      const res = await api.post('/api/user/login', { publicKey: currentWallet, primoHolder: holder, betaCode: code });
      if (res.data?.betaRedeemed) {
        setBetaRedeemed(true);
        localStorage.setItem('betaRedeemed', 'true');
        localStorage.removeItem('betaCode');
        setShowRedeemDialog(false);
      }
    } catch (e) {
      console.error('Beta redeem failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = React.useMemo(
    () => ({ isHolder, setIsHolder, betaRedeemed, setBetaRedeemed, loading, showRedeemDialog, setShowRedeemDialog, redeemBetaCode }),
    [isHolder, setIsHolder, betaRedeemed, setBetaRedeemed, loading, showRedeemDialog, setShowRedeemDialog, redeemBetaCode]
  );

  return (
    <PrimoHolderContext.Provider value={contextValue}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => React.useContext(PrimoHolderContext);
