import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../utils/api';
import { getAssetsByCollection, HeliusNFT, getNFTByTokenAddress } from '../utils/helius';
import { getLikes, toggleLike } from '../utils/likes';
import { keyframes } from '@emotion/react';

import './UserProfile.css';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { Box, Typography, TextField, Button, Avatar, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CircleIcon from '@mui/icons-material/Circle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Link, useParams } from 'react-router-dom';
import BetaRedeem from '../components/BetaRedeem';
import { Notification, AppMessage } from '../types';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import { verifyDomainOwnership, getPrimaryDomainName } from '../utils/sns';

type SocialLinks = {
  twitter: string;
  discord: string;
  website: string;
};

type UserDoc = {
  publicKey: string;
  bio: string;
  socials: SocialLinks;
  pfp: string;
  domain?: string;
  points: number;
  pointsToday: number;
  pointsDate: string;
  pesos: number;
  artTeam: boolean;
  workGroups: string[];
};

const getStatus = (count: number) => {
  if (count >= 15) return 'whale';
  if (count >= 3) return 'fish';
  return 'shrimp';
};

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;
const ADMIN_WALLET =
  process.env.REACT_APP_ADMIN_WALLET ?? 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6';

const formatTwitterUrl = (handle: string) => {
  const trimmed = handle.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://x.com/${trimmed.replace(/^@/, '')}`;
};

const formatWebsiteUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const UserProfile: React.FC = () => {
  const { publicKey } = useWallet();
  const params = useParams<{ publicKey?: string }>();
  const profileKey = params.publicKey || publicKey?.toBase58();
  const isOwner = publicKey && profileKey === publicKey.toBase58();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [pfpImage, setPfpImage] = useState<string | null>(null);
  const [showNFTs, setShowNFTs] = useState(false);
  const [pendingPfp, setPendingPfp] = useState<string | null>(null);
  const [pfpDialogOpen, setPfpDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ballVisible, setBallVisible] = useState(true);
  const [ballAnimating, setBallAnimating] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(true);

  useEffect(() => {
    if (profileKey) {
      api
        .get(`/api/user/${profileKey}`,
          publicKey ? { headers: { 'X-Public-Key': publicKey.toBase58() } } : undefined)
        .then((res) => setUser({ ...res.data, workGroups: res.data.workGroups || [] }))
        .catch(() => setUser(null));
    }
  }, [profileKey, publicKey]);

  // fetch primary SNS domain for this profile
  useEffect(() => {
    if (profileKey) {
      getPrimaryDomainName(profileKey)
        .then(setPrimaryDomain)
        .catch(() => setPrimaryDomain(null));
    }
  }, [profileKey]);

  useEffect(() => {
    if (isOwner && publicKey) {
      api
        .get('/api/notifications', {
          headers: { 'X-Public-Key': publicKey.toBase58() },
        })
        .then((res) => setNotifications(res.data))
        .catch(() => setNotifications([]));
    }
  }, [isOwner, publicKey]);

  useEffect(() => {
    if (profileKey) {
      setLoadingNfts(true);
      getAssetsByCollection(PRIMO_COLLECTION, profileKey)
        .then(setNfts)
        .catch(() => setNfts([]))
        .finally(() => setLoadingNfts(false));
    }
  }, [profileKey]);

  useEffect(() => {
    const load = async () => {
      const wallet = publicKey?.toBase58();
      const map: Record<string, { count: number; liked: boolean }> = {};
      for (const nft of nfts) {
        try {
          map[nft.id] = await getLikes(nft.id, wallet);
        } catch {
          map[nft.id] = { count: 0, liked: false };
        }
      }
      setLikes(map);
    };
    if (nfts.length) load();
  }, [nfts, publicKey]);

  useEffect(() => {
    async function fetchPFP() {
      if (user?.pfp) {
        const nft = await getNFTByTokenAddress(user.pfp.replace(/"/g, ''));
        setPfpImage(nft?.image || null);
      } else {
        setPfpImage(null);
      }
    }
    fetchPFP();
  }, [user?.pfp]);

  const handleSetPFP = (tokenAddress: string) => {
    if (user && publicKey && isOwner) {
      api
        .put(
          `/api/user/${publicKey.toBase58()}/pfp`,
          tokenAddress,
          { headers: { 'Content-Type': 'text/plain', 'X-Public-Key': publicKey.toBase58() } }
        )
        .then((res) => setUser({ ...res.data, workGroups: res.data.workGroups || [] }));
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

  const handleToggleLike = (tokenId: string) => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    toggleLike(tokenId, wallet)
      .then((res) =>
        setLikes((prev) => ({ ...prev, [tokenId]: res }))
      )
      .catch(() => {});
  };

  const confirmEditProfile = () => {
    setIsEditing(true);
    setEditDialogOpen(false);
  };

  const handleDismiss = (id: number) => {
    if (!publicKey) return;
    api
      .delete(`/api/notifications/${id}`, {
        headers: { 'X-Public-Key': publicKey.toBase58() },
      })
      .finally(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      });
  };

  const handleDismissAll = () => {
    if (!publicKey) return;
    api
      .delete('/api/notifications', {
        headers: { 'X-Public-Key': publicKey.toBase58() },
      })
      .finally(() => setNotifications([]));
  };

  const handleCopyPublicKey = () => {
    if (!profileKey) return;
    navigator.clipboard.writeText(profileKey);
    setMessage({ text: t('public_key_copied'), type: 'success' });
  };

  const handleSaveProfile = () => {
    setSaveDialogOpen(false);
    if (publicKey && user && isOwner) {
      const save = async () => {
        if (user.domain) {
          const owns = await verifyDomainOwnership(
            user.domain,
            publicKey.toBase58()
          );
          if (!owns) {
            setMessage({ text: t('sns_owner_error'), type: 'error' });
            return;
          }
        }
        api
          .put(`/api/user/${publicKey.toBase58()}`, user, {
            headers: { 'X-Public-Key': publicKey.toBase58() },
          })
          .then((res) => setUser({ ...res.data, workGroups: res.data.workGroups || [] }))
          .finally(() => {
            setIsEditing(false);
            setShowNFTs(false);
          });
      };
      save();
    }
  };

  useEffect(() => {
    if (user && user.pointsToday >= 4) {
      setBallVisible(false);
    } else {
      setBallVisible(true);
    }
  }, [user?.pointsToday]);

  const handleEarnPoint = () => {
    if (publicKey && user && isOwner && user.pointsToday < 4) {
      setBallAnimating(true);
      api
        .post(
          `/api/user/${publicKey.toBase58()}/points`,
          {},
          { headers: { 'Content-Type': 'application/json', 'X-Public-Key': publicKey.toBase58() } }
        )
        .then((res) => setUser({ ...res.data, workGroups: res.data.workGroups || [] }))
        .finally(() => {
          setTimeout(() => {
            setBallAnimating(false);
            if (user && user.pointsToday + 1 < 4) setBallVisible(true);
            else setBallVisible(false);
          }, 800);
        });
      setBallVisible(false);
    }
  };

  const float = keyframes`
  0% { transform: translateY(0px);}
  50% { transform: translateY(-20px);}
  100% { transform: translateY(0px);}
`;

const fadeOut = keyframes`
  0% { opacity: 1; transform: scale(1);}
  100% { opacity: 0; transform: scale(0.7);}
`;

  if (!user) return null;

  return (
    <>
      <Box className="user-profile">
        {pfpImage && (
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar src={pfpImage} sx={{ width: 120, height: 120, border: '2px solid #000' }} />
          </Box>
        )}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box className="wallet-info">
            <Typography sx={{ mb: 0 }}>
              <strong>{t('wallet')}</strong>{' '}
              {profileKey ? `${profileKey.slice(0, 4)}...${profileKey.slice(-3)}` : ''}
              {primaryDomain ? ` (${primaryDomain})` : ''}
            </Typography>
            <IconButton size="small" onClick={handleCopyPublicKey} aria-label={t('copy_public_key')}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
          {isOwner && (
            <>
              <Button
                variant="contained"
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setShowNFTs(false);
                  } else {
                    setEditDialogOpen(true);
                  }
                }}
                sx={{
                  background: '#111',
                  color: '#fff',
                  border: '1px solid #111',
                  ml: 1,
                  '&:hover': { background: '#222' },
                }}
              >
                {isEditing ? t('cancel') : t('edit')}
              </Button>
              <IconButton
                sx={{ ml: 1 }}
                aria-label="notifications"
                onClick={() => setNotifDialogOpen(true)}
              >
                <NotificationsIcon />
              </IconButton>
            </>
          )}
          {isOwner && publicKey?.toBase58() === ADMIN_WALLET && (
            <IconButton component={Link} to="/admin" sx={{ ml: 1 }}>
              <AdminPanelSettingsIcon />
            </IconButton>
          )}
        </Box>
        {isOwner && isEditing && (
          <Button
            variant="outlined"
            className="select-nft-pfp-btn"
            onClick={() => setShowNFTs((v) => !v)}
          >
            {showNFTs ? t('hide_nft_selection') : t('select_nft_as_pfp')}
          </Button>
        )}
        {isOwner && showNFTs && (
          loadingNfts ? (
            <Loading message={t('loading_nfts')} />
          ) : (
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
          )
        )}
        {isOwner && isEditing ? (
          <TextField
            label={t('twitter')}
            value={user.socials.twitter}
            onChange={(e) =>
              setUser({ ...user, socials: { ...user.socials, twitter: e.target.value } })
            }
            fullWidth
            margin="normal"
          />
        ) : (
          user.socials.twitter && (
            <Typography mt={2} sx={{ wordBreak: 'break-word' }}>
              <strong>{t('twitter')}</strong>{' '}
              <a
                href={formatTwitterUrl(user.socials.twitter)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.socials.twitter}
              </a>
            </Typography>
          )
        )}
        <TextField
          label={t('discord')}
          value={user.socials.discord}
          onChange={(e) =>
            setUser({ ...user, socials: { ...user.socials, discord: e.target.value } })
          }
          fullWidth
          margin="normal"
          disabled={!isOwner || !isEditing}
        />
        {isOwner && isEditing ? (
          <TextField
            label={t('website')}
            value={user.socials.website}
            onChange={(e) =>
              setUser({ ...user, socials: { ...user.socials, website: e.target.value } })
            }
            fullWidth
            margin="normal"
          />
        ) : (
          user.socials.website && (
            <Typography mt={2} sx={{ wordBreak: 'break-word' }}>
              <strong>{t('website')}</strong>{' '}
              <a
                href={formatWebsiteUrl(user.socials.website)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.socials.website}
              </a>
            </Typography>
          )
        )}
        <TextField
          label={t('sns_domain')}
          value={primaryDomain || ''}
          fullWidth
          margin="normal"
          disabled
        />
        <Typography mt={2}>
          <strong>{t('status')}</strong> {t(getStatus(nfts.length))}
        </Typography>
        <Typography>
          <strong>{t('marketplace_balance')}</strong> {user.pesos} {t('pesos')}
        </Typography>
        <Typography>
          <strong>{t('points')}</strong> {user.points}
        </Typography>
        {isOwner && (
          <Box display="flex" justifyContent="center" mt={2} sx={{ minHeight: 64 }}>
            {ballVisible ? (
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: user.pointsToday >= 4 ? 'not-allowed' : 'pointer',
                  animation: `${float} 2s ease-in-out infinite`,
                  transition: 'opacity 0.3s, transform 0.3s',
                  opacity: ballAnimating ? 0 : 1,
                  pointerEvents: ballAnimating || user.pointsToday >= 4 ? 'none' : 'auto',
                  zIndex: 2,
                  position: 'relative',
                  userSelect: 'none',
                  ...(ballAnimating && {
                    animation: `${fadeOut} 0.8s forwards`,
                  }),
                }}
                onClick={handleEarnPoint}
                title={
                  user.pointsToday >= 4
                    ? String(t('limit_reached') ?? '')
                    : String(t('earn_point') ?? '')
                }
              >
                <CircleIcon sx={{ fontSize: 32 }} />
              </Box>
            ) : (
              <Box sx={{ width: 64, height: 64 }} />
            )}
          </Box>
        )}
        {isOwner && isEditing && (
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
        <Box className="nfts-section">
          <Typography className="nfts-title" variant="h6">
            Primo NFTs
          </Typography>
          {loadingNfts ? (
            <Loading message={isOwner ? t('loading_nfts') : t('loading_primos_nfts')} />
          ) : (
            <Box className="profile-nft-grid">
              {nfts.map((nft) => (
                <Box key={nft.id} className="owned-nft-thumb">
                  <img src={nft.image} alt={nft.name} />
                  <Box className="like-row">
                    <Typography sx={{ fontSize: '0.8rem' }}>
                      {likes[nft.id]?.count ?? 0}
                    </Typography>
                    {publicKey && (
                      <IconButton size="small" onClick={() => handleToggleLike(nft.id)} aria-label="like">
                        {likes[nft.id]?.liked ? (
                          <FavoriteIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.9)' }} />
                        ) : (
                          <FavoriteBorderIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.9)' }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      {isOwner && <BetaRedeem />}
      {isOwner && (
      <>
      <Dialog.Root open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{t('notifications')}</Dialog.Title>
          {notifications.length === 0 ? (
            <Typography>{t('no_notifications')}</Typography>
          ) : (
            <>
              <Button size="small" onClick={handleDismissAll} sx={{ mb: 1 }}>
                {t('dismiss_all')}
              </Button>
              {notifications.map((n) => (
                <Box key={n.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>{n.message}</Typography>
                  <IconButton size="small" onClick={() => handleDismiss(n.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
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
      <MessageModal
        open={!!message}
        message={message}
        onClose={() => setMessage(null)}
      />
      </>
      )}
    </>
  );
};

export default UserProfile;
