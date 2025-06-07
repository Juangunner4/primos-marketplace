import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const SidebarNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const drawerContent = (
    <List sx={{ pt: 8 }}>
      <ListItem disablePadding sx={{ justifyContent: 'center' }}>
        <Tooltip title={t('market_title')} placement="right">
          <IconButton
            component={NavLink}
            to="/"
            color={location.pathname === '/' ? 'primary' : 'default'}
            sx={{
              color: location.pathname === '/' ? '#fff' : '#b0b0b0',
              textShadow: '0 0 6px #fff, 0 0 2px #fff',
              '&:hover': { color: '#fff', background: '#222' },
            }}
            onClick={() => setOpen(false)}
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
              color: location.pathname === '/collected' ? '#fff' : '#b0b0b0',
              textShadow: '0 0 6px #fff, 0 0 2px #fff',
              '&:hover': { color: '#fff', background: '#222' },
            }}
            onClick={() => setOpen(false)}
          >
            <WorkIcon />
          </IconButton>
        </Tooltip>
      </ListItem>
    </List>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            aria-label="open navigation"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1301,
              background: '#181818',
              color: '#ffe066',
              border: '1px solid #ffe066',
              '&:hover': { background: '#222' },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="left"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: 72,
                boxSizing: 'border-box',
                backgroundColor: '#181818',
                color: '#ffe066',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
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
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            },
            display: { xs: 'none', md: 'block' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default SidebarNav;