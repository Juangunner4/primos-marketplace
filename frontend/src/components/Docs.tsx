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
      <Typography variant="body1" className="docs-text">
        Welcome to the Primos Marketplace documentation.
      </Typography>
    </Box>
  );
};

export default Docs;
