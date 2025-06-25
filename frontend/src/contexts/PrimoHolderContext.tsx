import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useWallet } from '@solana/wallet-adapter-react';

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

  // whenever publicKey changes, fetch user record
  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      setUserExists(false);
      setBetaRedeemed(false);
      setIsHolder(false);
      return;
    }

    setLoading(true);
    api
      .get(`/api/user/${publicKey.toBase58()}`, {
        headers: { 'X-Public-Key': publicKey.toBase58() },
      })
      .then(res => {
        const user = res.data;
        // If user is found, set flags from user object
        if (user?.publicKey) {
          setUserExists(true);
          setBetaRedeemed(!!user.betaRedeemed);
          setIsHolder(!!user.primoHolder);
        } else {
          setUserExists(false);
          setBetaRedeemed(false);
          setIsHolder(false);
        }
      })
      .catch(() => {
        // on error, assume new user
        setUserExists(false);
        setBetaRedeemed(false);
        setIsHolder(false);
      })
      .finally(() => setLoading(false));
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
    setIsHolder(!!user.primoHolder);
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
