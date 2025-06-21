import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { checkPrimoHolder } from '../utils/helius';
import { getBackendUrl } from '../utils/env';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

export const PrimoHolderContext = React.createContext<{
  isHolder: boolean;
  setIsHolder: (v: boolean) => void;
  betaRedeemed: boolean;
  setBetaRedeemed: (v: boolean) => void;
}>({
  isHolder: false,
  setIsHolder: () => {},
  betaRedeemed: false,
  setBetaRedeemed: () => {},
});

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = React.useState(false);
  const [betaRedeemed, setBetaRedeemed] = React.useState(
    localStorage.getItem('betaRedeemed') === 'true'
  );
  const backendUrl = getBackendUrl();

  useEffect(() => {
    const loginAndCheckHolder = async () => {
      if (!publicKey) {
        setIsHolder(false);
        setBetaRedeemed(false);
        return;
      }
      try {
        const currentWallet = publicKey.toBase58();
        const storedWallet = localStorage.getItem('betaWallet');
        if (storedWallet !== currentWallet) {
          localStorage.removeItem('betaRedeemed');
          localStorage.removeItem('betaCode');
          localStorage.setItem('betaWallet', currentWallet);
        }

        const holder = await checkPrimoHolder(
          PRIMO_COLLECTION,
          currentWallet
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
          const res = await axios.post(`${backendUrl}/api/user/login`, payload);
          const serverRedeemed = res.data?.betaRedeemed ?? redeemed;
          setBetaRedeemed(serverRedeemed);
          if (!redeemed && serverRedeemed) {
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
        setBetaRedeemed(false);
      }
    };
    loginAndCheckHolder();
  }, [publicKey, backendUrl]);

  const contextValue = React.useMemo(
    () => ({ isHolder, setIsHolder, betaRedeemed, setBetaRedeemed }),
    [isHolder, setIsHolder, betaRedeemed, setBetaRedeemed]
  );

  return (
    <PrimoHolderContext.Provider value={contextValue}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => React.useContext(PrimoHolderContext);
