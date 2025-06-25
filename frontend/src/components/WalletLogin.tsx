import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { t } = useTranslation();
  const { publicKey, disconnect, select } = useWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!publicKey) {
    return <WalletMultiButton>{t('connect_wallet_button')}</WalletMultiButton>;
  }

  const shortKey = publicKey.toBase58().slice(0, 4) + '...';

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    await disconnect();
    handleMenuClose();
    window.location.reload();
  };

  const handleChangeWallet = () => {
    select(null);
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
          ml: 1,
          background: '#111',
          color: '#fff',
          border: '1px solid #111',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
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
        <MenuItem onClick={handleChangeWallet}>{t('change_wallet')}</MenuItem>
        <MenuItem onClick={handleDisconnect}>{t('disconnect_wallet')}</MenuItem>
      </Menu>
    </>
  );
};

export default WalletLogin;
