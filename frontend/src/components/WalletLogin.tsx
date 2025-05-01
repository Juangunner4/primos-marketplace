import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { connected, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLoginClick = () => {
    if (!connected) {
      setIsModalOpen(true);
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const confirmLogout = () => {
    disconnect();
    setShowLogoutConfirm(false);
    setIsModalOpen(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div>
      <button className="login-button" onClick={handleLoginClick}>
        {connected ? 'Logout' : 'Login'}
      </button>

      {/* Login modal */}
      {isModalOpen && !connected && !showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Connect Your Wallet</h2>
            <WalletMultiButton />
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Are you sure you want to log out?</h2>
            <button className="login-button" onClick={confirmLogout}>Yes, Log out</button>
            <button className="login-button" onClick={cancelLogout}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletLogin;
