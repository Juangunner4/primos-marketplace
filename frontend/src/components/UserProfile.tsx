import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getAssetsByCollection, HeliusNFT, getNFTByTokenAddress } from '../utils/helius';
import './UserProfile.css';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Box, Typography, TextField, Button, Avatar } from '@mui/material';

type SocialLinks = {
  twitter: string;
  discord: string;
  website: string;
};

type UserDoc = {
  publicKey: string;
  bio: string;
  socials: SocialLinks;
  pfp: string; // token address
  points: number;
  pesos: number;
};

const getStatus = (count: number) => {
  if (count >= 15) return 'whale';
  if (count >= 3) return 'fish';
  return 'shrimp';
};

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

const UserProfile: React.FC = () => {
  const { publicKey } = useWallet();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [pfpImage, setPfpImage] = useState<string | null>(null);
  const [showNFTs, setShowNFTs] = useState(false);
  const [pendingPfp, setPendingPfp] = useState<string | null>(null);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

  // Fetch user info
  useEffect(() => {
    if (publicKey) {
      axios.get(`${backendUrl}/api/user/${publicKey.toBase58()}`)
        .then(res => setUser(res.data));
    }
  }, [publicKey]);

  // Fetch Primos NFTs
  useEffect(() => {
    if (publicKey) {
      getAssetsByCollection(PRIMOS_COLLECTION_MINT, publicKey.toBase58())
        .then(setNfts);
    }
  }, [publicKey]);

  // Fetch PFP image from token address in DB
  useEffect(() => {
    async function fetchPFP() {
      if (user?.pfp) {
        const nft = await getNFTByTokenAddress(user.pfp.replace(/"/g, '')); // Remove any accidental quotes
        setPfpImage(nft?.image || null);
      } else {
        setPfpImage(null);
      }
    }
    fetchPFP();
  }, [user?.pfp]);

  // Update PFP in DB (store token address)
  const handleSetPFP = (tokenAddress: string) => {
    if (user && publicKey) {
      axios
        .put(
          `${backendUrl}/api/user/${publicKey.toBase58()}/pfp`,
          tokenAddress,
          { headers: { 'Content-Type': 'text/plain' } }
        )
        .then((res) => setUser(res.data));
    }
  };

  const confirmSetPFP = () => {
    if (pendingPfp) {
      handleSetPFP(pendingPfp);
    }
    setPfpDialogOpen(false);
  };

  const handleSelectNFT = (tokenAddress: string) => {
    setPendingPfp(tokenAddress);
    setPfpDialogOpen(true);
  };

  const confirmEditProfile = () => {
    setIsEditing(true);
    setEditDialogOpen(false);
  };

  const handleSaveProfile = () => {
    setSaveDialogOpen(false);
    if (publicKey && user) {
      axios
        .put(`${backendUrl}/api/user/${publicKey.toBase58()}`, user)
        .then((res) => setUser(res.data))
        .finally(() => setIsEditing(false));
    }
  };

  if (!publicKey || !user) return null;

  return (
    <>
      <Box className="user-profile">
        {pfpImage && (
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar src={pfpImage} sx={{ width: 120, height: 120, border: '2px solid #000' }} />
          </Box>
        )}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography className="wallet-info" sx={{ mb: 0 }}>
            <strong>{t('wallet')}</strong> {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-3)}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setEditDialogOpen(true)}
            sx={{
              background: '#111',
              color: '#fff',
              border: '1px solid #111',
              ml: 1,
              '&:hover': { background: '#222' },
            }}
          >
            {t('edit')}
          </Button>
        </Box>
        <Button
          variant="outlined"
          className="select-nft-pfp-btn"
          onClick={() => setShowNFTs((v) => !v)}
        >
          {showNFTs ? t('hide_nft_selection') : t('select_nft_as_pfp')}
        </Button>
        {showNFTs && (
          <Box className="profile-nft-grid">
            {nfts.map((nft, i) => {
              const isSelected = user.pfp.replace(/"/g, '') === nft.id;
              return (
                <button
                  key={i}
                  type="button"
                  className={`profile-nft-thumb${isSelected ? ' selected' : ''}`}
                  onClick={() => !isSelected && handleSelectNFT(nft.id)}
                  tabIndex={isSelected ? -1 : 0}
                  aria-disabled={isSelected}
                >
                  <img src={nft.image} alt={nft.name} />
                  {isSelected && (
                    <span className="selected-overlay">{t('selected')}</span>
                  )}
                </button>
              );
            })}
          </Box>
        )}
        <TextField
          label={t('twitter')}
          value={user.socials.twitter}
          onChange={(e) =>
            setUser({ ...user, socials: { ...user.socials, twitter: e.target.value } })
          }
          fullWidth
          margin="normal"
          disabled={!isEditing}
        />
        <TextField
          label={t('discord')}
          value={user.socials.discord}
          onChange={(e) =>
            setUser({ ...user, socials: { ...user.socials, discord: e.target.value } })
          }
          fullWidth
          margin="normal"
          disabled={!isEditing}
        />
        <TextField
          label={t('website')}
          value={user.socials.website}
          onChange={(e) =>
            setUser({ ...user, socials: { ...user.socials, website: e.target.value } })
          }
          fullWidth
          margin="normal"
          disabled={!isEditing}
        />
        <Typography mt={2}>
          <strong>{t('status')}</strong> {t(getStatus(nfts.length))}
        </Typography>
        <Typography>
          <strong>{t('marketplace_balance')}</strong> {user.pesos} {t('pesos')}
        </Typography>
        {isEditing && (
          <Button
            variant="contained"
            sx={{
              mt: 2,
              background: '#111',
              color: '#fff',
              border: '1px solid #111',
              '&:hover': { background: '#222' },
            }}
            onClick={() => setSaveDialogOpen(true)}
          >
            {t('save')}
          </Button>
        )}
      </Box>
      <Dialog.Root open={pfpDialogOpen} onOpenChange={setPfpDialogOpen}>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('confirm_update_pfp')}</Dialog.Title>
          <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
            <Button variant="contained" onClick={confirmSetPFP}>
              {t('yes_save')}
            </Button>
            <Button variant="outlined" onClick={() => setPfpDialogOpen(false)}>
              {t('cancel')}
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('confirm_edit_profile')}</Dialog.Title>
          <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
            <Button variant="contained" onClick={confirmEditProfile}>
              {t('yes_edit')}
            </Button>
            <Button variant="outlined" onClick={() => setEditDialogOpen(false)}>
              {t('cancel')}
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('confirm_save_profile')}</Dialog.Title>
          <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
            <Button variant="contained" onClick={handleSaveProfile}>
              {t('yes_save')}
            </Button>
            <Button variant="outlined" onClick={() => setSaveDialogOpen(false)}>
              {t('cancel')}
            </Button>
          </Box>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default UserProfile;
