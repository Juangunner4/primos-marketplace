import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { fetchCollectionNFTsForOwner, HeliusNFT } from '../utils/helius';
import MessageModal from '../components/MessageModal';
import { AppMessage } from '../types';
import './Stickers.css';
import Loading from '../components/Loading';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

const Stickers: React.FC = () => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [selected, setSelected] = useState<HeliusNFT | null>(null);
  const [message, setMessage] = useState<AppMessage | null>(null);
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

  const handleOrder = () => {
    if (!selected) return;
    setMessage({ text: t('stickers_order_thanks') });
  };

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment2_title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('experiment2_desc')}
      </Typography>
      {loading ? (
        <Loading message={t('loading_nfts')} />
      ) : (
        <Box className="nft-grid">
          {nfts.map((nft) => (
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
            </div>
          ))}
        </Box>
      )}
      <Button variant="contained" sx={{ mt: 2 }} disabled={!selected} onClick={handleOrder}>
        {t('order_sticker')}
      </Button>
      <MessageModal
        open={!!message}
        message={message}
        onClose={() => setMessage(null)}
      />
    </Box>
  );
};

export default Stickers;
