import React, { useEffect } from 'react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!connected) {
      setVisible(true);
    }
  }, [connected, setVisible]);

  return <WalletMultiButton />;
};

export default WalletLogin;
