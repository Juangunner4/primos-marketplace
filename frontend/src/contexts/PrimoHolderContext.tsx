import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';


interface PrimoContextValue {
  isHolder: boolean;
}

const PrimoHolderContext = createContext<PrimoContextValue>({ isHolder: false });

export const PrimoHolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [isHolder, setIsHolder] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8080";

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkHolder = async () => {
      if (!publicKey) {
        setIsHolder(false);
        return;
      }
      try {
        const res = await axios.get<Record<string, number>>(
          `${backendUrl}/api/stats/member-nft-counts`
        );
        const holder = (res.data[publicKey.toBase58()] ?? 0) > 0;
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
    interval = setInterval(checkHolder, 60_000);

    return () => clearInterval(interval);
  }, [publicKey, backendUrl]);

  return (
    <PrimoHolderContext.Provider value={{ isHolder }}>
      {children}
    </PrimoHolderContext.Provider>
  );
};

export const usePrimoHolder = () => useContext(PrimoHolderContext);
