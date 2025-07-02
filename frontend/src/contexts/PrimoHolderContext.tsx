import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { usePrivyWallet } from '../hooks/usePrivyWallet';
import { checkPrimoHolder } from '../utils/helius'; // <-- import checkPrimoHolder

interface PrimoHolderContextValue {
  isHolder: boolean;
  userExists: boolean;
  betaRedeemed: boolean;
  showRedeemDialog: boolean;
  setShowRedeemDialog(open: boolean): void;
  redeemBetaCode(code: string): Promise<void>;
  loading: boolean;
}

const PrimoHolderContext = createContext<PrimoHolderContextValue>(null!);

export const PrimoHolderProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { publicKey } = usePrivyWallet();
  const [loading, setLoading] = useState(true);
  const [isHolder, setIsHolder] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [betaRedeemed, setBetaRedeemed] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  // whenever publicKey changes, fetch user record and check blockchain holder status
  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        console.log('[PrimoHolderContext] No publicKey, resetting state.');
        setLoading(false);
        setUserExists(false);
        setBetaRedeemed(false);
        setIsHolder(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[PrimoHolderContext] Checking Primo holder status for:', publicKey.toBase58());
        // 1. Check blockchain first
        const holderStatus = await checkPrimoHolder(
          process.env.REACT_APP_PRIMOS_COLLECTION as string,
          publicKey.toBase58()
        );
        console.log('[PrimoHolderContext] Holder status:', holderStatus);
        setIsHolder(!!holderStatus);

        if (!holderStatus) {
          // Not a holder: skip API, set states accordingly
          console.log('[PrimoHolderContext] Not a holder, skipping user API.');
          setUserExists(false);
          setBetaRedeemed(false);
          setLoading(false);
          return;
        }

        // 2. If holder, fetch user info
        console.log('[PrimoHolderContext] Fetching user info from API for:', publicKey.toBase58());
        const userRes = await api.get(`/api/user/${publicKey.toBase58()}`, {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        });
        const user = userRes.data;
        console.log('[PrimoHolderContext] User API response:', user);
        setUserExists(!!user?.publicKey);
        setBetaRedeemed(!!user?.betaRedeemed);
      } catch (err) {
        console.error('[PrimoHolderContext] Error in fetchData:', err);
        setUserExists(false);
        setBetaRedeemed(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicKey]);

  const redeemBetaCode = async (code: string) => {
    console.log('[PrimoHolderContext] Redeeming beta code:', code);
    const res = await api.post(
      `/api/user/login`,
      {
        publicKey: publicKey!.toBase58(),
        primoHolder: false,
        betaCode: code
      }
    );
    // Update state from backend response
    const user = res.data;
    console.log('[PrimoHolderContext] Beta code redeemed, user:', user);
    setBetaRedeemed(!!user.betaRedeemed);
    setUserExists(!!user.publicKey);

    // Always check blockchain for isHolder
    console.log('[PrimoHolderContext] Re-checking Primo holder status after redeem.');
    const holderStatus = await checkPrimoHolder(
      process.env.REACT_APP_PRIMOS_COLLECTION as string,
      publicKey!.toBase58()
    );
    console.log('[PrimoHolderContext] Holder status after redeem:', holderStatus);
    setIsHolder(!!holderStatus);
  };

  const contextValue = React.useMemo(
    () => ({
      isHolder,
      userExists,
      betaRedeemed,
      showRedeemDialog,
      setShowRedeemDialog,
      redeemBetaCode,
      loading,
    }),
    [
      isHolder,
      userExists,
      betaRedeemed,
      showRedeemDialog,
      setShowRedeemDialog,
      redeemBetaCode,
      loading,
    ]
  );

  return (
    <PrimoHolderContext.Provider value={contextValue}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => useContext(PrimoHolderContext);
