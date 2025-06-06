import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
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
  pfp: string;
  points: number;
  pesos: number;
};

const getStatus = (count: number) => {
  if (count >= 15) return 'Whale 🐋';
  if (count >= 3) return 'Fish 🐠';
  return 'Shrimp 🦐';
};

const UserProfile: React.FC = () => {
  const { publicKey } = useWallet();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [nfts, setNfts] = useState<string[]>([]);
  const [selectedPFP, setSelectedPFP] = useState('');

  useEffect(() => {
    if (publicKey) {
      // 1. Login or fetch user
      axios.post('/api/user/login', { publicKey: publicKey.toBase58() })
        .then(res => setUser(res.data));
      // 2. Fetch NFTs (replace with real fetch)
      setNfts([
        'https://placekitten.com/100/100',
        'https://placekitten.com/101/101',
        'https://placekitten.com/102/102',
      ]);
    }
  }, [publicKey]);

  // Update PFP in DB
  const handleSetPFP = (nft: string) => {
    setSelectedPFP(nft);
    if (user && publicKey) {
      axios.put('/api/user/profile', {
        publicKey: publicKey.toBase58(),
        pfp: nft
      }).then(res => setUser(res.data));
    }
  };

  if (!publicKey || !user) return null;

  const status = getStatus(nfts.length);

  return (
    <div className="user-profile">
      <h2>Your Profile</h2>
      <div className="wallet-info">
        <strong>Wallet:</strong> {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-3)}
      </div>
      <div>
        <strong>PFP:</strong>
        {user.pfp && <img src={user.pfp} alt="pfp" style={{ width: 60, borderRadius: '50%' }} />}
      </div>
      <label>Select NFT as PFP</label>
      <div className="nft-preview">
        {nfts.map((nft, i) => (
          <img
            key={i}
            src={nft}
            alt={`nft-${i}`}
            onClick={() => handleSetPFP(nft)}
            className={selectedPFP === nft || user.pfp === nft ? 'selected' : ''}
          />
        ))}
      </div>
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
        <strong>Marketplace Balance:</strong> {user.pesos} Pesos
      </p>
      <p>
        <strong>Points:</strong> {user.points}
      </p>
      <p>
        <strong>Status:</strong> {status}
      </p>
    </div>
  );
};

export default UserProfile;
