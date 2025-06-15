import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './WalletLogin.css';

const WalletLogin: React.FC = () => {
  const { publicKey, disconnect, select } = useWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!publicKey) {
    return <WalletMultiButton />;
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
  };

  const handleChangeWallet = () => {
    select(null);
    handleMenuClose();
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
        <MenuItem onClick={handleChangeWallet}>Change Wallet</MenuItem>
        <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
      </Menu>
    </>
  );
};

export default WalletLogin;
