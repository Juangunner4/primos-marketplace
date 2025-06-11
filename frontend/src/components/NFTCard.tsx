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
  solPriceUsd?: number; // Optionally pass SOL price in USD for conversion
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, open, onClose, solPriceUsd }) => {
  if (!nft) return null;
  const variant =
    CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
  const priceSol = nft.price ? nft.price.toFixed(3) : null;
  const priceUsd =
    nft.price && solPriceUsd ? (nft.price * solPriceUsd).toFixed(2) : null;

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
          <div className="market-card-content"></div>
          <div className="market-card-footer">
            {priceSol ? (
              <span
                className="market-nft-price-pill"
                style={{ background: variant.bg, borderColor: variant.border }}
              >
                {priceSol} SOL
                {priceUsd && <span className="usd"> (${priceUsd})</span>}
              </span>
            ) : (
              <span
                className="market-nft-price-pill"
                style={{ background: variant.bg, borderColor: variant.border }}
              >
                No price
              </span>
            )}
            <button className="buy-button" onClick={onClose}>
              Buy Now
            </button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NFTCard;
