import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';

const TrenchesFallback: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { t } = useTranslation();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '50vh',
      padding: 3,
      textAlign: 'center'
    }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('trenches_unavailable') || 'Trenches Temporarily Unavailable'}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        {t('trenches_error_message') || 'We are experiencing technical difficulties with the Trenches page. Please try again later.'}
      </Typography>

      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          Wallet Connected: {connected ? 'Yes' : 'No'}<br/>
          Public Key: {publicKey ? publicKey.toBase58().slice(0, 8) + '...' : 'None'}<br/>
          Environment: {process.env.NODE_ENV}<br/>
          Primo Collection: {process.env.REACT_APP_PRIMOS_COLLECTION ? 'Set' : 'Missing'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ 
            backgroundColor: '#000', 
            color: '#fff',
            '&:hover': { backgroundColor: '#333' }
          }}
        >
          {t('reload_page') || 'Reload Page'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/'}
          sx={{ 
            borderColor: '#000', 
            color: '#000',
            '&:hover': { borderColor: '#333', color: '#333' }
          }}
        >
          {t('go_home') || 'Go Home'}
        </Button>
      </Box>
    </Box>
  );
};

export default TrenchesFallback;
