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
  const { betaRedeemed, showRedeemDialog, setShowRedeemDialog, redeemBetaCode } = usePrimoHolder();
  const [showWelcome, setShowWelcome] = useState(false);
  // initialize from prop:
  const [open, setOpen] = useState(autoOpen);
  const [code, setCode] = useState('');
  const { t } = useTranslation();

  // parent‐ or context‐triggered opens
  useEffect(() => {
    if (showRedeemDialog) {
      setOpen(true);
    }
  }, [showRedeemDialog]);

  // auto-open when parent says so (e.g. !userExists)
  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  // hide completely for no‐wallet, admin or already redeemed
  if (!publicKey || publicKey.toBase58() === ADMIN_WALLET || betaRedeemed) return null;

  const handleRedeem = async () => {
    await redeemBetaCode(code);
    setOpen(false);
    setShowWelcome(true);
  };

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={o => {
          setOpen(o);
          if (!o) setShowRedeemDialog(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title style={{ color: '#fff' }}>{t('enter_beta_code')}</Dialog.Title>
            <Dialog.Description style={{ color: '#fff', margin: '0.5rem 0 1rem' }}>
              {t('beta_dialog_message')}
            </Dialog.Description>
            <TextField
              label={t('enter_beta_code')}
              value={code}
              onChange={e => setCode(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: '#fff' } }}
              sx={{
                '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                '& .MuiOutlinedInput-input': { color: '#fff' }
              }}
            />
            <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="contained" onClick={handleRedeem}>
                {t('redeem_beta')}
              </Button>
              <Button variant="outlined" onClick={() => setOpen(false)} sx={{ color: '#fff', borderColor: '#fff' }}>
                {t('cancel')}
              </Button>
            </Box>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Snackbar
        open={showWelcome}
        message={t('welcome_message') || 'Welcome to Primos Marketplace!'}
        action={
          <Button color="inherit" size="small" onClick={() => { setShowWelcome(false); window.location.reload(); }}>
            {t('ok') || 'OK'}
          </Button>
        }
      />
    </>
  );
};

export default BetaRedeem;
