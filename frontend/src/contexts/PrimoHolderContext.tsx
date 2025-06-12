import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { checkPrimoHolder } from '../utils/helius';

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
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8080";

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
        await axios.post(`${backendUrl}/api/user/login`, {
          publicKey: publicKey.toBase58(),
          primoHolder: holder,
        });
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
