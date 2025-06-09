import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePrimoHolder } from '../contexts/PrimoHolderContext';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
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

  const links = [
    { to: '/', icon: <HomeIcon />, label: t('home'), show: true },
    { to: '/market', icon: <StorefrontIcon />, label: t('market_title'), show: true },
    { to: '/docs', icon: <MenuBookIcon />, label: t('docs_title'), show: true },
    { to: '/collected', icon: <WorkIcon />, label: t('your_primos_nfts'), show: publicKey && isHolder },
    { to: '/labs', icon: <ScienceIcon />, label: t('primo_labs'), show: publicKey && isHolder },
    { to: '/primos', icon: <PeopleIcon />, label: t('primos_title'), show: publicKey && isHolder },
  ];

  const drawerContent = (
    <List sx={{ pt: 8 }}>
      {links.filter(l => l.show).map((l) => (
        <ListItem key={l.to} disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={l.label} placement="right">
            <IconButton
              component={NavLink}
              to={l.to}
              color={location.pathname === l.to ? 'primary' : 'default'}
              sx={{
                color: location.pathname === l.to ? '#fff' : '#b0b0b0',
                textShadow: '0 0 6px #fff, 0 0 2px #fff',
                '&:hover': { color: '#fff', background: '#222' },
              }}
              onClick={() => setOpen(false)}
            >
              {l.icon}
            </IconButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  );

  const drawerContentMobile = (
    <List sx={{ pt: 2 }}>
      {links.filter(l => l.show).map((l) => (
        <ListItem key={l.to} disablePadding>
          <ListItemButton
            component={NavLink}
            to={l.to}
            selected={location.pathname === l.to}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon sx={{ color: '#fff' }}>{l.icon}</ListItemIcon>
            <ListItemText primary={l.label} />
          </ListItemButton>
        </ListItem>
      ))}
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
              background: '#000',
              color: '#fff',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              '&:hover': { background: '#222' },
              width: 48,
              height: 48,
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
                width: 220,
                boxSizing: 'border-box',
                backgroundColor: '#000',
                color: '#fff',
                borderRight: '1px solid #fff',
              },
            }}
          >
            {drawerContentMobile}
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