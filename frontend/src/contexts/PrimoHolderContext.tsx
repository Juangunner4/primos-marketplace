import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { checkPrimoHolder } from '../utils/helius';
import { getBackendUrl } from '../utils/env';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

export const PrimoHolderContext = React.createContext<{
  isHolder: boolean;
  setIsHolder: (v: boolean) => void;
}>({
  isHolder: false,
  setIsHolder: () => {},
});

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = React.useState(false);
  const backendUrl = getBackendUrl();

  useEffect(() => {
    const loginAndCheckHolder = async () => {
      if (!publicKey) {
        setIsHolder(false);
        return;
      }
      try {
        const holder = await checkPrimoHolder(
          PRIMO_COLLECTION,
          publicKey.toBase58()
        );
        setIsHolder(holder);
        const redeemed = localStorage.getItem('betaRedeemed') === 'true';
        let betaCode = localStorage.getItem('betaCode') ?? '';
        const payload: any = {
          publicKey: publicKey.toBase58(),
          primoHolder: holder,
        };
        if (!redeemed && betaCode) {
          payload.betaCode = betaCode;
        }
        try {
          await axios.post(`${backendUrl}/api/user/login`, payload);
          if (!redeemed) {
            localStorage.setItem('betaRedeemed', 'true');
            localStorage.removeItem('betaCode');
          }
        } catch (err: any) {
          if (!redeemed && err.response && err.response.status === 403) {
            // Invalid or missing beta code will be handled by the BetaRedeem dialog
          } else {
            throw err;
          }
        }
      } catch (e) {
        console.error('Failed to check Primo holder status:', e);
        setIsHolder(false);
      }
    };
    loginAndCheckHolder();
  }, [publicKey, backendUrl]);

  const contextValue = React.useMemo(() => ({ isHolder, setIsHolder }), [isHolder, setIsHolder]);

  return (
    <PrimoHolderContext.Provider value={contextValue}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => React.useContext(PrimoHolderContext);
