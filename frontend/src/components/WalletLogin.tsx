import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './WalletLogin.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:8080";

async function ensureUser(publicKey: string) {
  await axios.post(`${backendUrl}/api/user/login`, { publicKey });
}

const WalletLogin: React.FC = () => {
  const { connected, disconnect, publicKey } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate(); 
  const { t } = useTranslation();

  useEffect(() => {
    if (connected && publicKey) {
      ensureUser(publicKey.toString());
    }
  }, [connected, publicKey]);

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
