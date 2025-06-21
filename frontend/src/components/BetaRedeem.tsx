import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import './BetaRedeem.css';

interface BetaRedeemProps {
  autoOpen?: boolean;
}

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

const BetaRedeem: React.FC<BetaRedeemProps> = ({ autoOpen = false }) => {
  const { publicKey } = useWallet();
  const { betaRedeemed, setBetaRedeemed } = usePrimoHolder();
  const [open, setOpen] = useState(autoOpen);
  const [code, setCode] = useState('');
  const { t } = useTranslation();

  if (
    !publicKey ||
    publicKey.toBase58() === ADMIN_WALLET ||
    betaRedeemed
  )
    return null;

  const handleRedeem = () => {
    localStorage.setItem('betaCode', code);
    localStorage.setItem('betaRedeemed', 'false');
    if (publicKey) {
      localStorage.setItem('betaWallet', publicKey.toBase58());
    }
    setBetaRedeemed(false);
    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {!autoOpen && (
        <Dialog.Trigger asChild>
          <Button variant="outlined" sx={{ mt: 2 }}>
            {t('redeem_beta')}
          </Button>
        </Dialog.Trigger>
      )}
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
