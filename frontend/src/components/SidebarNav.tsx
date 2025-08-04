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
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import WorkIcon from '@mui/icons-material/Work';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const SidebarNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { publicKey } = useWallet();
  const { isHolder, betaRedeemed, userExists } = usePrimoHolder();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', icon: <HomeIcon />, label: t('home'), show: true, end: true },
    { to: '/market', icon: <StorefrontIcon />, label: t('market_title'), show: true },
    { to: '/docs', icon: <MenuBookIcon />, label: t('docs_title'), show: true },
    { to: '/trenches', icon: <MilitaryTechIcon />, label: t('experiment3_title'), show: true },
    {
      to: '/collected',
      icon: <WorkIcon />,
      label: t('your_primos_nfts'),
      show: publicKey && (isHolder || betaRedeemed) && userExists,
    },
    {
      to: '/labs',
      icon: <ScienceIcon />,
      label: t('primo_labs'),
      show: publicKey && (isHolder || betaRedeemed) && userExists,
    },
    {
      to: '/primos',
      icon: <PeopleIcon />,
      label: t('primos_title'),
      show: true,
    },
  ];

  const drawerContent = (
    <List sx={{ pt: 8 }}>
      {links.filter(l => l.show).map((l) => (
        <ListItem key={l.to} disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={l.label} placement="right">
            <IconButton
              component={NavLink}
              to={l.to}
              {...(l.end ? { end: true } : {})}
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
    <List sx={{ pt: 8 }}>
      {links.filter(l => l.show).map((l) => (
        <ListItem key={l.to} disablePadding sx={{ justifyContent: 'center' }}>
          <Tooltip title={l.label} placement="right">
            <IconButton
              component={NavLink}
              to={l.to}
              {...(l.end ? { end: true } : {})}
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

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            aria-label="open navigation"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 30,
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
                width: 72,
                boxSizing: 'border-box',
                backgroundColor: '#181818',
                color: '#ffe066',
                borderRight: '1px solid rgba(255, 255, 255, 0.5)',
              },
              display: { xs: 'block', md: 'none'},
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