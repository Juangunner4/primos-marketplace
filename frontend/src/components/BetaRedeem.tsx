import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BetaRedeem: React.FC = () => {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const { t } = useTranslation();

  if (!publicKey || localStorage.getItem('betaRedeemed') === 'true') return null;

  const handleRedeem = () => {
    localStorage.setItem('betaCode', code);
    localStorage.setItem('betaRedeemed', 'false');
    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outlined" sx={{ mt: 2 }}>
          {t('redeem_beta')}
        </Button>
      </Dialog.Trigger>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content">
        <Dialog.Title>{t('enter_beta_code')}</Dialog.Title>
        <TextField
          label={t('enter_beta_code')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
        <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
          <Button variant="contained" onClick={handleRedeem}>
            {t('redeem_beta')}
          </Button>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default BetaRedeem;
