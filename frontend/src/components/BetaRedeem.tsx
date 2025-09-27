import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, TextField, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Snackbar from '@mui/material/Snackbar';
import { useWeyHolder } from '../contexts/WeyHolderContext';
import './BetaRedeem.css';

const CODE_REGEX = /^BETA-[A-Za-z0-9]{8}$/;

const BetaRedeem: React.FC<{ autoOpen?: boolean }> = ({ autoOpen = false }) => {
  const { publicKey } = useWallet();
  const {
    betaRedeemed,
    userExists,
    showRedeemDialog,
    setShowRedeemDialog,
    redeemBetaCode,
    isHolder,
  } = useWeyHolder();

  const [open, setOpen] = useState(autoOpen);
  const [code, setCode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (showRedeemDialog) setOpen(true);
  }, [showRedeemDialog]);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  // nothing to show for no-wallet or admin, or once they both exist+redeemed
  if (!publicKey || publicKey.toBase58() === process.env.REACT_APP_ADMIN_WALLET) return null;
  if (betaRedeemed && userExists) return null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setCode(v);
    setIsValid(CODE_REGEX.test(v));
  };

  const handleRedeem = async () => {
    if (!isValid) return;
    await redeemBetaCode(code);
    setOpen(false);
    setShowWelcome(true);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={o => { setOpen(o); if (!o) setShowRedeemDialog(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            {isHolder ? (
              <>
                <Dialog.Title className="dialog-title">{t('enter_beta_code')}</Dialog.Title>
                <Dialog.Description className="dialog-desc">
                  {t('beta_dialog_message')}
                </Dialog.Description>
                <TextField
                  label={t('enter_beta_code')}
                  value={code}
                  onChange={handleInput}
                  error={code !== '' && !isValid}
                  helperText={code !== '' && !isValid ? t('invalid_code_format') || 'Must be BETA-XXXXXXXX' : ''}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
                    '& .MuiOutlinedInput-input': { color: '#000' },
                    '& .MuiInputLabel-root': { color: '#000' }
                  }}
                />
                <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleRedeem}
                    disabled={!isValid}
                    sx={{
                      backgroundColor: '#000',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#333' }
                    }}
                  >
                    {t('redeem_beta')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setOpen(false)}
                    sx={{ borderColor: '#000', color: '#000' }}
                  >
                    {t('cancel')}
                  </Button>
                </Box>
              </>
            ) : (
              <Dialog.Description className="dialog-desc" style={{ textAlign: 'center', fontSize: 18 }}>
                {t('not_holder_message')}
              </Dialog.Description>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Snackbar
        open={showWelcome}
        message={t('welcome_message') || 'Welcome to Weys Marketplace!'}
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
