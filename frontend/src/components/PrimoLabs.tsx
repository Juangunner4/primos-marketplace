import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import './PrimoLabs.css';
import { useTranslation } from 'react-i18next';

type PrimoLabsProps = {
  connected?: boolean;
};

const PrimoLabs: React.FC<PrimoLabsProps> = ({ connected }) => {
  const wallet = useWallet();
  const isConnected = connected ?? wallet.connected;
  const { t } = useTranslation();

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
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('primo_labs_desc')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {/* You can add more info or features here in the future */}
      </Typography>
    </Box>
  );
};

export default PrimoLabs;
