import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import './Docs.css';

const Docs: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box className="docs-container">
      <Typography variant="h4" className="docs-title">
        {t('docs_title')}
      </Typography>
      <Typography variant="body1" className="docs-text" sx={{ mb: 3 }}>
        {t('docs_welcome')}
      </Typography>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {t('docs_treasury_title')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_treasury_desc')}
      </Typography>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {t('docs_governance_title')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_governance_desc')}
      </Typography>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {t('docs_utility_title')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_utility_desc')}
      </Typography>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {t('docs_open_source_title')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_open_source_desc')}
      </Typography>

      {/* Image placeholder */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          height: 200,
          background: '#eee',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '32px auto 24px auto'
        }}
      >
        <Typography color="text.secondary">{t('docs_image_alt')}</Typography>
      </Box>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {t('docs_join_family')}
      </Typography>
    </Box>
  );
};

export default Docs;
