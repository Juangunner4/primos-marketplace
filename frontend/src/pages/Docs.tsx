import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import * as RadixScrollArea from '@radix-ui/react-scroll-area';
import { useTranslation } from 'react-i18next';
import img802 from '../images/802.png';
import './Docs.css';

const NAV_ITEMS = [
  { key: 'overview', label: 'docs_nav_overview' },
  { key: 'treasury', label: 'docs_nav_treasury' },
  { key: 'governance', label: 'docs_nav_governance' },
  { key: 'utility', label: 'docs_nav_utility' },
  { key: 'open-source', label: 'docs_nav_open_source' },
];

const Docs: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState('overview');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box className="docs-container" sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
      {/* Sidebar */}
      {isMobile ? (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            zIndex: 1200,
            borderRadius: 0,
          }}
        >
          <RadixScrollArea.Root type="auto" style={{ width: '100vw', overflowX: 'auto' }}>
            <BottomNavigation
              showLabels
              value={active}
              onChange={(_, newValue) => setActive(newValue)}
              sx={{
                width: '100vw',
                background: '#fff',
                borderTop: '1px solid #eee',
              }}
            >
              {NAV_ITEMS.map((item) => (
                <BottomNavigationAction
                  key={item.key}
                  label={t(item.label)}
                  value={item.key}
                  sx={{
                    minWidth: 80,
                    color: active === item.key ? theme.palette.primary.main : '#555',
                  }}
                />
              ))}
            </BottomNavigation>
          </RadixScrollArea.Root>
        </Paper>
      ) : (
        <Paper
          elevation={3}
          sx={{
            width: 180,
            minWidth: 140,
            maxWidth: 220,
            p: 0,
            pt: 2,
            mr: 2,
            position: 'sticky',
            top: 80,
            height: 'fit-content',
            alignSelf: 'flex-start',
            background: '#fff',
          }}
        >
          <List component="nav" aria-label="docs navigation">
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.key}
                selected={active === item.key}
                onClick={() => setActive(item.key)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: active === item.key ? theme.palette.primary.main : '#222',
                  fontWeight: active === item.key ? 700 : 500,
                }}
              >
                <ListItemText primary={t(item.label)} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* Content */}
      <Box className="docs-content" sx={{ pb: { xs: 8, sm: 0 } }}>
        <section
          id="overview"
          style={{ display: active === 'overview' ? 'block' : 'none' }}
        >
          <Typography variant="h4" className="docs-title" sx={{ mb: 2 }}>
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
        </section>
        <section
          id="treasury"
          style={{ display: active === 'treasury' ? 'block' : 'none' }}
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
          style={{ display: active === 'governance' ? 'block' : 'none' }}
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
          style={{ display: active === 'utility' ? 'block' : 'none' }}
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
          style={{ display: active === 'open-source' ? 'block' : 'none' }}
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
