import React, { useState } from 'react';
import { usePrivyWallet } from '../hooks/usePrivyWallet';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { t } = useTranslation();
  const { publicKey, login, logout } = usePrivyWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!publicKey) {
    return (
      <Button
        variant="contained"
        onClick={() => login()}
      >
        {t('connect_wallet_button')}
      </Button>
    );
  }

  const shortKey = publicKey.toBase58().slice(0, 4) + '...';

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    await logout();
    handleMenuClose();
    window.location.reload();
  };

  return (
    <>
      <Button
        variant="contained"
        className="login-button"
        sx={{
          minWidth: 40,
          height: 40,
          ml: 1,
          background: '#111',
          color: '#fff',
          border: '1px solid #111',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'transform 0.18s',
          '&:hover': {
            background: '#f5f5f5',
            color: '#111',
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
        onClick={handleMenuOpen}
      >
        {shortKey}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleDisconnect}>{t('disconnect_wallet')}</MenuItem>
      </Menu>
    </>
  );
};

export default WalletLogin;
