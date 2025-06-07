import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';

const SidebarNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 72,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 72,
          boxSizing: 'border-box',
          backgroundColor: '#181818',
          color: '#ffe066',
          borderRight: '1px solid #222',
        },
        display: { xs: 'none', md: 'block' },
      }}
    >
      <List sx={{ pt: 8 }}>
        <ListItem disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={t('market_title')} placement="right">
            <IconButton
              component={NavLink}
              to="/"
              color={location.pathname === '/' ? 'primary' : 'default'}
              sx={{
                color: location.pathname === '/' ? '#ff5ca7' : '#ffe066',
                '&:hover': { color: '#ff5ca7', background: '#222' },
              }}
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={t('your_primos_nfts')} placement="right">
            <IconButton
              component={NavLink}
              to="/collected"
              color={location.pathname === '/collected' ? 'primary' : 'default'}
              sx={{
                color: location.pathname === '/collected' ? '#ff5ca7' : '#ffe066',
                '&:hover': { color: '#ff5ca7', background: '#222' },
              }}
            >
              <WorkIcon />
            </IconButton>
          </Tooltip>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default SidebarNav;