import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getAssetsByCollection, HeliusNFT, getNFTByTokenAddress } from '../utils/helius';
import './UserProfile.css';

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
  if (count >= 15) return 'Whale 🐋';
  if (count >= 3) return 'Fish 🐠';
  return 'Shrimp 🦐';
};

const PRIMOS_COLLECTION_MINT = '2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb';

const UserProfile: React.FC = () => {
  const { publicKey } = useWallet();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [nfts, setNfts] = useState<HeliusNFT[]>([]);
  const [pfpImage, setPfpImage] = useState<string | null>(null);
  const [showNFTs, setShowNFTs] = useState(false);
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
      axios.put(
        `${backendUrl}/api/user/${publicKey.toBase58()}/pfp`,
        tokenAddress, // plain string, not JSON
        { headers: { 'Content-Type': 'text/plain' } }
      ).then(res => setUser(res.data));
    }
  };

  if (!publicKey || !user) return null;

  return (
    <div className="user-profile">
      {/* PFP image fetched from Helius using token address from DB */}
      {pfpImage && (
        <div className="pfp-image-top">
          <img src={pfpImage} alt="Profile NFT" className="pfp-img-top" />
        </div>
      )}
      {/* Token address below the image */}
      {/* {user.pfp && (
        <div className="pfp-token-address">
          <span>{user.pfp.replace(/"/g, '')}</span>
        </div>
      )} */}
      <div className="wallet-info">
        <strong>Wallet:</strong> {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-3)}
      </div>
      <button
        type="button"
        className="select-nft-pfp-btn"
        onClick={() => setShowNFTs(v => !v)}
      >
        {showNFTs ? "Hide NFT Selection" : "Select NFT as PFP"}
      </button>
      {showNFTs && (
        <div className="profile-nft-grid">
          {nfts.map((nft, i) => {
            const isSelected = user.pfp.replace(/"/g, '') === nft.id;
            return (
              <button
                key={i}
                type="button"
                className={`profile-nft-thumb${isSelected ? ' selected' : ''}`}
                onClick={() => !isSelected && handleSetPFP(nft.id)}
                tabIndex={isSelected ? -1 : 0}
                aria-disabled={isSelected}
              >
                <img src={nft.image} alt={nft.name} />
                {isSelected && (
                  <span className="selected-overlay">Selected</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <label>Twitter</label>
      <input
        value={user.socials.twitter}
        onChange={e => setUser({ ...user, socials: { ...user.socials, twitter: e.target.value } })}
        placeholder="@yourhandle"
      />
      <label>Discord</label>
      <input
        value={user.socials.discord}
        onChange={e => setUser({ ...user, socials: { ...user.socials, discord: e.target.value } })}
        placeholder="User#1234"
      />
      <label>Website</label>
      <input
        value={user.socials.website}
        onChange={e => setUser({ ...user, socials: { ...user.socials, website: e.target.value } })}
        placeholder="https://yourdomain.xyz"
      />
      <p>
        <strong>Status:</strong> {getStatus(nfts.length)}
      </p>
      <p>
        <strong>Marketplace Balance:</strong> {user.pesos} Pesos
      </p>
    </div>
  );
};

export default UserProfile;
