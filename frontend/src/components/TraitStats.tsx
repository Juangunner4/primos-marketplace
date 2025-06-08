import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { getNFTByTokenAddress } from '../utils/helius';
import { getTraitFloorPrice } from '../utils/magiceden';
import './TraitStats.css';

interface Props {
  nftIds: string[];
}

const MAGICEDEN_SYMBOL = 'primos';

type Attribute = { trait_type: string; value: string };

const TraitStats: React.FC<Props> = ({ nftIds }) => {
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [traitFloors, setTraitFloors] = useState<Record<string, number | null>>({});
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const counts: Record<string, number> = {};
      for (const id of nftIds) {
        const meta = await getNFTByTokenAddress(id);
        const attrs = (meta as any)?.attributes as Attribute[] | undefined;
        if (attrs) {
          for (const a of attrs) {
            const key = `${a.trait_type}: ${a.value}`;
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      }
      if (!cancelled) setTraits(counts);

      // Fetch floor prices for each trait
      const floorPromises = Object.keys(counts).map(async (key) => {
        const [trait_type, value] = key.split(": ").map((s) => s.trim());
        const price = await getTraitFloorPrice(MAGICEDEN_SYMBOL, trait_type, value);
        return [key, price] as [string, number | null];
      });
      const floorEntries = await Promise.all(floorPromises);
      if (!cancelled) {
        setTraitFloors(Object.fromEntries(floorEntries));
      }
    }
    if (nftIds.length) {
      load();
    } else {
      setTraits({});
      setTraitFloors({});
    }
    return () => { cancelled = true; };
  }, [nftIds]);

  const entries = Object.entries(traits).sort((a, b) => b[1] - a[1]);

  const panel = (
    <Box component="aside" className={`trait-panel${isMobile ? '' : ' trait-desktop'}`}>
      <Typography variant="h6" component="h3" className="trait-title">
        {t('trait_stats')}
      </Typography>
      <List className="trait-list">
        <ListItem className="trait-row" disableGutters style={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>
          <span className="trait-pill">{t('trait')}</span>
          <span className="trait-count">{t('count')}</span>
          <span className="trait-floor">{t('floor')}</span>
        </ListItem>
        {entries.map(([t, c]) => (
          <ListItem key={t} className="trait-row" disableGutters>
            <span className="trait-pill">{t}</span>
            <span className="trait-count">{c}</span>
            <span className="trait-floor">
              {(() => {
                if (traitFloors[t] === undefined) return '...';
                if (traitFloors[t] === null) return '—';
                return traitFloors[t]?.toLocaleString(undefined, { maximumFractionDigits: 2 });
              })()}
            </span>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <IconButton
            aria-label={t('open_traits')}
            className="trait-mobile-btn"
            sx={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              zIndex: 1301,
              background: '#000',
              color: '#fff',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              '&:hover': { background: '#222' },
            }}
          >
            <BarChartIcon />
          </IconButton>
        </Dialog.Trigger>
        {mounted && (
          <Dialog.Portal>
            <Dialog.Overlay className="trait-overlay" />
            <Dialog.Content className="trait-dialog-content">
              {panel}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    );
  }

  return panel;
};

export default TraitStats;
