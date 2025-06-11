import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import './NFTCard.css';
import { CARD_VARIANTS } from '../utils/cardVariants';

export type MarketNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
  attributes?: { trait_type: string; value: string }[];
};

interface NFTCardProps {
  nft: MarketNFT | null;
  open: boolean;
  onClose: () => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, open, onClose }) => {
  if (!nft) return null;
  const variant =
    CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
  const priceSol = nft.price ? nft.price.toFixed(3) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Overlay className="nft-dialog-overlay" />
      <Dialog.Content className="nft-dialog-content">
        <div
          className={`market-card market-card--${variant.name}`}
          style={{ margin: '0 auto' }}
        >
          <span
            className="market-prefix market-primo-number"
            style={{ background: variant.bg, borderColor: variant.border }}
          >
            {nft.name}
          </span>
          <img src={nft.image} alt={nft.name} className="market-nft-img" />
          <div className="market-card-content">
            {nft.rank !== null && (
              <span className="rarity-rank">Rank: {nft.rank}</span>
            )}
          </div>
          <div className="market-card-footer">
            {priceSol && (
              <span
                className="market-nft-price-pill"
                style={{ background: variant.bg, borderColor: variant.border }}
              >
                {priceSol} SOL
              </span>
            )}
            <button className="buy-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NFTCard;
