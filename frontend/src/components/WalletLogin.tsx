import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { connected, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginClick = () => {
    if (!connected) {
      setIsModalOpen(true);
    } else {
      disconnect();
    }
  };

  return (
    <div>
      <button className="login-button" onClick={handleLoginClick}>
        {connected ? 'Logout' : 'Login'}
      </button>

      {isModalOpen && !connected && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Connect Your Wallet</h2>
            <WalletMultiButton />
            {/* Additional user info like profile picture and username can be added here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletLogin;
