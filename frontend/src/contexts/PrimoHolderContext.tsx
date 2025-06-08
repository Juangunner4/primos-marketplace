import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getAssetsByCollection } from '../utils/helius';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

interface PrimoContextValue {
  isHolder: boolean;
}

const PrimoHolderContext = createContext<PrimoContextValue>({ isHolder: false });

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8080";

  useEffect(() => {
    const checkHolder = async () => {
      if (!publicKey) {
        setIsHolder(false);
        return;
      }
      try {
        const nfts = await getAssetsByCollection(
          PRIMOS_COLLECTION_MINT,
          publicKey.toBase58()
        );
        const holder = nfts.length > 0;
        setIsHolder(holder);
        await axios.post(`${backendUrl}/api/user/login`, {
          publicKey: publicKey.toBase58(),
          primoHolder: holder,
        });
      } catch (e) {
        setIsHolder(false);
      }
    };
    checkHolder();
  }, [publicKey]);

  return (
    <PrimoHolderContext.Provider value={{ isHolder }}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => useContext(PrimoHolderContext);
