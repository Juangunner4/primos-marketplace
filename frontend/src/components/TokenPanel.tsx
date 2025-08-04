import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { fetchTokenMetadata, TokenMetadata } from '../services/token';
import './TokenPanel.css';

interface TokenPanelProps {
  contract: string | null;
  open: boolean;
  onClose: () => void;
}

const TokenPanel: React.FC<TokenPanelProps> = ({ contract, open, onClose }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<TokenMetadata | null>(null);

  useEffect(() => {
    if (!open || !contract) return;
    fetchTokenMetadata(contract)
      .then(setData)
      .catch(() => setData(null));
  }, [open, contract]);

  useEffect(() => {
    if (!open) setData(null);
  }, [open]);

  if (!open || !contract) return null;

  return (
    <Box className="token-panel" sx={{ zIndex: 1300 }}>
      <Typography className="dialog-title">{t('token_metadata')}</Typography>
      <IconButton
        className="token-close"
        onClick={onClose}
        aria-label={t('close')}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
        {data ? (
          <>
            {data.image && (
              <Box
                component="img"
                src={data.image}
                alt={data.name}
                sx={{ width: '100%', borderRadius: 1, mb: 1 }}
              />
            )}
            {Object.entries(data)
              .filter(([k]) => k !== 'image' && (data as any)[k])
              .map(([k, v]) => (
                <Typography key={k} variant="body2" sx={{ mb: 1 }}>
                  {k}: {v as string}
                </Typography>
              ))}
          </>
        ) : (
          <Typography variant="body2">{t('loading')}...</Typography>
        )}
      </Box>
    </Box>
  );
};

export default TokenPanel;
