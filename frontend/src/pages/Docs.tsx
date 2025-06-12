import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import img802 from '../images/802.png';
import './Docs.css';

const Docs: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState('overview');
  return (
    <Box className="docs-container">
      <nav className="docs-sidebar">
        <button
          className={active === 'overview' ? 'active' : ''}
          onClick={() => setActive('overview')}
        >
          {t('docs_nav_overview')}
        </button>
        <button
          className={active === 'treasury' ? 'active' : ''}
          onClick={() => setActive('treasury')}
        >
          {t('docs_nav_treasury')}
        </button>
        <button
          className={active === 'governance' ? 'active' : ''}
          onClick={() => setActive('governance')}
        >
          {t('docs_nav_governance')}
        </button>
        <button
          className={active === 'utility' ? 'active' : ''}
          onClick={() => setActive('utility')}
        >
          {t('docs_nav_utility')}
        </button>
        <button
          className={active === 'open-source' ? 'active' : ''}
          onClick={() => setActive('open-source')}
        >
          {t('docs_nav_open_source')}
        </button>
      </nav>
      <Box className="docs-content">
        <section
          id="overview"
          className={`docs-section ${active === 'overview' ? 'active' : ''}`}
        >
          <Typography variant="h4" className="docs-title">
            {t('docs_title')}
          </Typography>
          <Typography variant="body1" className="docs-text" sx={{ mb: 3 }}>
            {t('docs_welcome')}
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
        </section>

        <section
          id="treasury"
          className={`docs-section ${active === 'treasury' ? 'active' : ''}`}
        >
          <Typography variant="h5" sx={{ mt: 3 }}>
            {t('docs_treasury_title')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('docs_treasury_desc')}
          </Typography>
        </section>

        <section
          id="governance"
          className={`docs-section ${active === 'governance' ? 'active' : ''}`}
        >
          <Typography variant="h5" sx={{ mt: 3 }}>
            {t('docs_governance_title')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('docs_governance_desc')}
          </Typography>
        </section>

        <section
          id="utility"
          className={`docs-section ${active === 'utility' ? 'active' : ''}`}
        >
          <Typography variant="h5" sx={{ mt: 3 }}>
            {t('docs_utility_title')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('docs_utility_desc')}
          </Typography>
        </section>

        <section
          id="open-source"
          className={`docs-section ${active === 'open-source' ? 'active' : ''}`}
        >
          <Typography variant="h5" sx={{ mt: 3 }}>
            {t('docs_open_source_title')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('docs_open_source_desc')}
          </Typography>
        </section>
      </Box>
    </Box>
  );
};

export default Docs;
