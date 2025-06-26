import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [isHolder, setIsHolder] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [betaRedeemed, setBetaRedeemed] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  // whenever publicKey changes, fetch user record and check blockchain holder status
  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setLoading(false);
        setUserExists(false);
        setBetaRedeemed(false);
        setIsHolder(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Check blockchain first
        const holderStatus = await checkPrimoHolder(
          process.env.REACT_APP_PRIMO_COLLECTION as string,
          publicKey.toBase58()
        );
        setIsHolder(!!holderStatus);

        if (!holderStatus) {
          // Not a holder: skip API, set states accordingly
          setUserExists(false);
          setBetaRedeemed(false);
          setLoading(false);
          return;
        }

        // 2. If holder, fetch user info
        const userRes = await api.get(`/api/user/${publicKey.toBase58()}`, {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        });
        const user = userRes.data;
        setUserExists(!!user?.publicKey);
        setBetaRedeemed(!!user?.betaRedeemed);
      } catch {
        setUserExists(false);
        setBetaRedeemed(false);
        setIsHolder(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicKey]);

  const redeemBetaCode = async (code: string) => {
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
    setBetaRedeemed(!!user.betaRedeemed);
    setUserExists(!!user.publicKey);

    // Always check blockchain for isHolder
    const holderStatus = await checkPrimoHolder(process.env.REACT_APP_PRIMO_COLLECTION as string, publicKey!.toBase58());
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
