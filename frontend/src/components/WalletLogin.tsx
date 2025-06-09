import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  // Holder checks and backend login are now handled in PrimoHolderContext.
  return <WalletMultiButton />;
};

export default WalletLogin;
