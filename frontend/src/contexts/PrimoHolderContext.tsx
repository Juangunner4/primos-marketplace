import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAssetsByCollection } from '../utils/helius';

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

interface PrimoContextValue {
  isHolder: boolean;
}

const PrimoHolderContext = createContext<PrimoContextValue>({ isHolder: false });

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = useState(false);

  useEffect(() => {
    const checkHolder = async () => {
      if (!publicKey) {
        setIsHolder(false);
        return;
      }
      try {
        const nfts = await getAssetsByCollection(PRIMOS_COLLECTION_MINT, publicKey.toBase58());
        setIsHolder(nfts.length > 0);
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
