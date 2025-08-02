import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { fetchCollectionNFTsForOwner, HeliusNFT } from '../utils/helius';
import api from '../utils/api';
import MessageModal from '../components/MessageModal';
import { AppMessage } from '../types';
import './Experiment1.css';
import Loading from '../components/Loading';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface Primo3D {
  tokenAddress: string;
  name: string;
  image: string;
  stlUrl: string;
  status: string;
  jobId: string;
}

interface StatusInfo {
  status: string;
  stlUrl?: string;
}

const Experiment1: React.FC = () => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [selected, setSelected] = useState<HeliusNFT | null>(null);
  const [rendering, setRendering] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, StatusInfo>>({});
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNfts = async () => {
      if (!wallet.publicKey) return;
      setLoading(true);
      try {
        const items = await fetchCollectionNFTsForOwner(
          wallet.publicKey.toBase58(),
          PRIMO_COLLECTION
        );
        setNfts(items);
      } finally {
        setLoading(false);
      }
    };
    fetchNfts();
  }, [wallet.publicKey]);

  useEffect(() => {
    const loadStatus = async () => {
      const map: Record<string, StatusInfo> = {};
      for (const nft of nfts) {
        try {
          const res = await api.get<Primo3D>(`/api/primo3d/${nft.id}`);
          if (res.data) {
            map[nft.id] = { status: res.data.status, stlUrl: res.data.stlUrl };
          }
        } catch {}
      }
      setStatuses(map);
    };
    if (nfts.length) loadStatus();
  }, [nfts]);

  const handleRender = async () => {
    if (!selected) return;
    const status = statuses[selected.id]?.status;
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') return;
    setConfirmOpen(true);
  };

  const confirmRender = async () => {
    if (!selected) return;
    setConfirmOpen(false);
    setRendering(true);
    try {
      const res = await api.post<Primo3D>(
        '/api/primo3d',
        {
          tokenAddress: selected.id,
          name: selected.name,
          image: selected.image,
        },
        { headers: { 'X-Public-Key': wallet.publicKey?.toBase58() } }
      );
      setMessage({ text: t('render_thanks'), type: 'info' });
      setStatuses((prev) => ({
        ...prev,
        [selected.id]: { status: res.data.status, stlUrl: res.data.stlUrl },
      }));
    } finally {
      setRendering(false);
    }
  };

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment1_title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('experiment1_select')}
      </Typography>
      {loading ? (
        <Loading message={t('loading_nfts')} />
      ) : (
        <Box className="nft-grid">
          {nfts.map((nft) => {
            const s = statuses[nft.id]?.status;
            let label = '';
            if (s === 'IN_PROGRESS') label = t('render_status_in_progress');
            else if (s === 'COMPLETED') label = t('render_status_done');
            else if (s) label = t('render_status_not_started');
            return (
              <div
                key={nft.id}
                className="nft-wrapper"
                onClick={() => setSelected(nft)}
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className={selected?.id === nft.id ? 'nft selected' : 'nft'}
                />
                {label && <span className="status-badge">{label}</span>}
              </div>
            );
          })}
        </Box>
      )}
      {selected && statuses[selected.id]?.stlUrl && (
        <Button sx={{ mt: 2 }} onClick={() => window.open(statuses[selected.id]!.stlUrl, '_blank')}>
          {t('download_3d')}
        </Button>
      )}
      <Button
        variant="contained"
        sx={{ mt: 2, ml: 2 }}
        disabled={
          !selected || rendering ||
          (selected && (statuses[selected.id]?.status === 'IN_PROGRESS' || statuses[selected.id]?.status === 'COMPLETED'))
        }
        onClick={handleRender}
      >
        {rendering ? t('experiment1_rendering') : t('experiment1_render')}
      </Button>
      <MessageModal
        open={confirmOpen}
        message={{ text: t('render_confirm') }}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmRender}
        confirmLabel={t('experiment1_render')}
      />
      <MessageModal
        open={!!message}
        message={message}
        onClose={() => setMessage(null)}
      />
    </Box>
  );
};

export default Experiment1;
