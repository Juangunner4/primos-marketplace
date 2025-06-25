import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Snackbar from '@mui/material/Snackbar';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import './BetaRedeem.css';

interface BetaRedeemProps {
  autoOpen?: boolean;
}

const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

const BetaRedeem: React.FC<BetaRedeemProps> = ({ autoOpen = false }) => {
  const { publicKey } = useWallet();
  const { isHolder, betaRedeemed, showRedeemDialog, setShowRedeemDialog, redeemBetaCode } = usePrimoHolder();
  const [showWelcome, setShowWelcome] = useState(false);
  const [open, setOpen] = useState(autoOpen || showRedeemDialog);
  const [code, setCode] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (showRedeemDialog) setOpen(true);
  }, [showRedeemDialog]);

  useEffect(() => {
    if (
      autoOpen &&
      !betaRedeemed &&
      publicKey &&
      isHolder &&
      publicKey.toBase58() !== ADMIN_WALLET
    ) {
      setOpen(true);
    }
  }, [autoOpen, betaRedeemed, publicKey, isHolder]);

  // Only hide if no wallet, admin, or already redeemed (holders & non-holders with 403 can see dialog)
  if (!publicKey || publicKey.toBase58() === ADMIN_WALLET || betaRedeemed) return null;

  const handleRedeem = async () => {
    await redeemBetaCode(code);
    setOpen(false);
    setShowWelcome(true);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowRedeemDialog(false); }}>
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
      <Snackbar
        open={showWelcome}
        autoHideDuration={3000}
        onClose={() => setShowWelcome(false)}
        message={t('welcome_message') || 'Welcome to Primos Marketplace!'}
      />
    </>
  );
};

export default BetaRedeem;
