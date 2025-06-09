import React, { useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import { checkPrimoHolder } from '../utils/helius';
import axios from 'axios';
import './WalletLogin.css';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

const WalletLogin: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { setIsHolder } = usePrimoHolder();

  useEffect(() => {
    const verifyOwnership = async () => {
      if (!connected || !publicKey) {
        setIsHolder(false);
        return;
      }

      // Use the new checkPrimoHolder function for a live check
      const isHolder = await checkPrimoHolder(PRIMO_COLLECTION, publicKey.toBase58());

      setIsHolder(isHolder);

      // 2. Update backend
      try {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8080'}/api/user/login`,
          { publicKey: publicKey.toBase58(), primoHolder: isHolder }
        );
      } catch (e) {
        console.error('Failed to update backend holder status:', e);
      }
    };
    verifyOwnership();
  }, [connected, publicKey, setIsHolder]);

  return <WalletMultiButton />;
};

export default WalletLogin;
