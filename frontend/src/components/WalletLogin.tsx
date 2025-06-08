import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import './WalletLogin.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8080";

async function ensureUser(publicKey: string) {
  await axios.post(`${backendUrl}/api/user/login`, { publicKey });
}

const WalletLogin: React.FC = () => {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      ensureUser(publicKey.toString());
    } else {
    }
  }, [connected, publicKey]);

  return (
    <WalletMultiButton />
  );
};

export default WalletLogin;
