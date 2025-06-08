import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import './PrimoLabs.css';

type PrimoLabsProps = {
  connected?: boolean;
};

const PrimoLabs: React.FC<PrimoLabsProps> = ({ connected }) => {
  const wallet = useWallet();
  const isConnected = connected ?? wallet.connected;

  if (!isConnected) {
    return (
      <Dialog.Root open>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Typography variant="h6">
            Please login to access Primo Labs
          </Typography>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Box className="labs-container">
      <Typography variant="h4" className="labs-title">
        Primo Labs
      </Typography>
      <Typography variant="body1">Welcome to Primo Labs!</Typography>
    </Box>
  );
};

export default PrimoLabs;
