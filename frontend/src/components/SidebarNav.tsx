import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WorkIcon from '@mui/icons-material/Work';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const SidebarNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { publicKey } = useWallet();
  const { isHolder } = usePrimoHolder();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const drawerContent = (
    <List sx={{ pt: 8 }}>
      <ListItem disablePadding sx={{ justifyContent: 'center' }}>
        <Tooltip title={t('home')} placement="right">
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
        <Tooltip title={t('market_title')} placement="right">
          <IconButton
            component={NavLink}
            to="/market"
            color={location.pathname === '/market' ? 'primary' : 'default'}
            sx={{
              color: location.pathname === '/market' ? '#fff' : '#b0b0b0',
              textShadow: '0 0 6px #fff, 0 0 2px #fff',
              '&:hover': { color: '#fff', background: '#222' },
            }}
            onClick={() => setOpen(false)}
          >
            <StorefrontIcon />
          </IconButton>
        </Tooltip>
      </ListItem>
      <ListItem disablePadding sx={{ justifyContent: 'center' }}>
        <Tooltip title={t('docs_title')} placement="right">
          <IconButton
            component={NavLink}
            to="/docs"
            color={location.pathname === '/docs' ? 'primary' : 'default'}
            sx={{
              color: location.pathname === '/docs' ? '#fff' : '#b0b0b0',
              textShadow: '0 0 6px #fff, 0 0 2px #fff',
              '&:hover': { color: '#fff', background: '#222' },
            }}
            onClick={() => setOpen(false)}
          >
            <MenuBookIcon />
          </IconButton>
        </Tooltip>
      </ListItem>
      {publicKey && isHolder && (
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
      )}
      {publicKey && isHolder && (
        <ListItem disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={t('primo_labs')} placement="right">
            <IconButton
              component={NavLink}
              to="/labs"
              color={location.pathname === '/labs' ? 'primary' : 'default'}
              sx={{
                color: location.pathname === '/labs' ? '#fff' : '#b0b0b0',
                textShadow: '0 0 6px #fff, 0 0 2px #fff',
                '&:hover': { color: '#fff', background: '#222' },
              }}
              onClick={() => setOpen(false)}
            >
              <ScienceIcon />
            </IconButton>
          </Tooltip>
        </ListItem>
      )}
      {publicKey && isHolder && (
        <ListItem disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={t('primos_title')} placement="right">
            <IconButton
              component={NavLink}
              to="/primos"
              color={location.pathname === '/primos' ? 'primary' : 'default'}
              sx={{
                color: location.pathname === '/primos' ? '#fff' : '#b0b0b0',
                textShadow: '0 0 6px #fff, 0 0 2px #fff',
                '&:hover': { color: '#fff', background: '#222' },
              }}
              onClick={() => setOpen(false)}
            >
              <PeopleIcon />
            </IconButton>
          </Tooltip>
        </ListItem>
      )}
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
              bottom: 24, // Move to bottom
              left: 24,   // Move to left
              zIndex: 1301,
              background: '#000', // Black background
              color: '#fff',      // White icon
              border: '1.5px solid #fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              '&:hover': { background: '#222' },
              width: 56,
              height: 56,
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
                backgroundColor: '#000', // Black drawer
                color: '#fff',           // White icons
                borderRight: '1px solid #fff',
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