import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import img802 from '../images/802.png';
import './Docs.css';

const Docs: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box className="docs-container">
      <nav className="docs-sidebar">
        <a href="#overview">{t('docs_nav_overview')}</a>
        <a href="#treasury">{t('docs_nav_treasury')}</a>
        <a href="#governance">{t('docs_nav_governance')}</a>
        <a href="#utility">{t('docs_nav_utility')}</a>
        <a href="#open-source">{t('docs_nav_open_source')}</a>
      </nav>
      <Box className="docs-content">
        <Typography variant="h4" className="docs-title" id="overview">
          {t('docs_title')}
        </Typography>
        <Typography variant="body1" className="docs-text" sx={{ mb: 3 }}>
          {t('docs_welcome')}
        </Typography>

        <Typography variant="h5" id="treasury" sx={{ mt: 3 }}>
          {t('docs_treasury_title')}
        </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_treasury_desc')}
      </Typography>

        <Typography variant="h5" id="governance" sx={{ mt: 3 }}>
          {t('docs_governance_title')}
        </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_governance_desc')}
      </Typography>

        <Typography variant="h5" id="utility" sx={{ mt: 3 }}>
          {t('docs_utility_title')}
        </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_utility_desc')}
      </Typography>

        <Typography variant="h5" id="open-source" sx={{ mt: 3 }}>
          {t('docs_open_source_title')}
        </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('docs_open_source_desc')}
      </Typography>

        <div className="docs-img-wrapper">
          <img src={img802} alt={t('docs_image_alt')} className="docs-img" />
          <div className="docs-img-overlay">
            <Typography variant="h6" className="overlay-title">
              {t('primo_labs_floating_title')}
            </Typography>
            <Typography variant="body2" className="overlay-body">
              {t('primo_labs_floating_body')}
            </Typography>
          </div>
        </div>

        <Typography variant="h5" sx={{ mt: 3 }}>
          {t('docs_join_family')}
        </Typography>
      </Box>
    </Box>
  );
};

export default Docs;
