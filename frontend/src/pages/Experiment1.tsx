import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { fetchCollectionNFTsForOwner, HeliusNFT } from '../utils/helius';
import api from '../utils/api';
import Spline from '@splinetool/react-spline';
import './Experiment1.css';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

interface Primo3D {
  tokenAddress: string;
  name: string;
  image: string;
  stlUrl: string;
}

const Experiment1: React.FC = () => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [selected, setSelected] = useState<HeliusNFT | null>(null);
  const [rendered, setRendered] = useState<Primo3D | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    const fetchNfts = async () => {
      if (!wallet.publicKey) return;
      const items = await fetchCollectionNFTsForOwner(
        wallet.publicKey.toBase58(),
        PRIMO_COLLECTION
      );
      setNfts(items);
    };
    fetchNfts();
  }, [wallet.publicKey]);

  const handleRender = async () => {
    if (!selected) return;
    setRendering(true);
    try {
      const res = await api.post<Primo3D>('/api/primo3d', {
        tokenAddress: selected.id,
        name: selected.name,
        image: selected.image,
      });
      setRendered(res.data);
    } finally {
      setRendering(false);
    }
  };

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment1_title')}
      </Typography>
      {!rendered ? (
        <>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('experiment1_select')}
          </Typography>
          <Box className="nft-grid">
            {nfts.map((nft) => (
              <img
                key={nft.id}
                src={nft.image}
                alt={nft.name}
                className={selected?.id === nft.id ? 'nft selected' : 'nft'}
                onClick={() => setSelected(nft)}
              />
            ))}
          </Box>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!selected || rendering}
            onClick={handleRender}
          >
            {rendering ? t('experiment1_rendering') : t('experiment1_render')}
          </Button>
        </>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Spline scene={rendered.stlUrl} className="experiment-iframe" />
        </Box>
      )}
    </Box>
  );
};

export default Experiment1;
