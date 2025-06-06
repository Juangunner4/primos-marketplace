import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { connected, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate(); 
  const { t } = useTranslation();

  const handleLoginClick = () => {
    if (!connected) {
      setIsModalOpen(true);
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const confirmLogout = async () => {
    await disconnect();
    setShowLogoutConfirm(false);
    setIsModalOpen(false);
    navigate('/');
    setTimeout( () => window.location.reload(), 1000);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div>
      <button className="login-button" onClick={handleLoginClick}>
        {connected ? t('logout') : t('login')}
      </button>

      {/* Login modal */}
      {isModalOpen && !connected && !showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('connect_wallet_modal')}</h2>
            <WalletMultiButton />
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('logout_confirm')}</h2>
            <button className="login-button" onClick={confirmLogout}>{t('yes_logout')}</button>
            <button className="login-button" onClick={cancelLogout}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletLogin;
