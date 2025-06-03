import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import './UserProfile.css';

type SocialLinks = {
    twitter: string;
    discord: string;
    website: string;
};

const getStatus = (count: number) => {
    if (count >= 15) return 'Whale 🐋';
    if (count >= 5) return 'Fish 🐠';
    return 'Shrimp 🦐';
};

const UserProfile: React.FC = () => {
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [selectedPFP, setSelectedPFP] = useState('');
    const [socials, setSocials] = useState<SocialLinks>({
        twitter: '',
        discord: '',
        website: '',
    });
    const [currencyBalance, setCurrencyBalance] = useState('0');

    useEffect(() => {
        if (publicKey) {
            // Dummy NFT image URLs - replace with real data later
            setNfts([
                'https://placekitten.com/100/100',
                'https://placekitten.com/101/101',
                'https://placekitten.com/102/102',
            ]);
            setCurrencyBalance('123.45'); // dummy balance
        }
    }, [publicKey]);

    const status = getStatus(nfts.length);
    const walletDisplay = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-3)}`
        : '';

    if (!publicKey) return null;

    return (
        <div className="user-profile">
            <h2>Your Profile</h2>

            <div className="wallet-info">
                <strong>Wallet:</strong> {walletDisplay}
            </div>

            <label>Bio</label>
            <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={300}
            />

            <label>Select NFT as PFP</label>
            <div className="nft-preview">
                {nfts.map((nft, i) => (
                    <img
                        key={i}
                        src={nft}
                        alt={`nft-${i}`}
                        onClick={() => setSelectedPFP(nft)}
                        className={selectedPFP === nft ? 'selected' : ''}
                    />
                ))}
            </div>

            <label>Twitter</label>
            <input
                value={socials.twitter}
                onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                placeholder="@yourhandle"
            />

            <label>Discord</label>
            <input
                value={socials.discord}
                onChange={(e) => setSocials({ ...socials, discord: e.target.value })}
                placeholder="User#1234"
            />

            <label>Website</label>
            <input
                value={socials.website}
                onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                placeholder="https://yourdomain.xyz"
            />

            <p>
                <strong>Marketplace Balance:</strong> {currencyBalance} Pesos
            </p>
            <p>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
};

export default UserProfile;
