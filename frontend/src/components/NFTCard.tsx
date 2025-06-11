import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import './NFTCard.css';
import { CARD_VARIANTS } from '../utils/cardVariants';
import TransactionCard from './TransactionCard';

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
  const { t } = useTranslation();
  if (!nft) return null;
  const variant =
    CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
  // Add rankVariant logic
  let rankVariant = CARD_VARIANTS.find(v => v.name === 'bronze');
  if (nft.rank !== null && nft.rank <= 100) {
    rankVariant = CARD_VARIANTS.find(v => v.name === 'gold');
  } else if (nft.rank !== null && nft.rank <= 500) {
    rankVariant = CARD_VARIANTS.find(v => v.name === 'silver');
  }
  const priceSol = nft.price ? nft.price.toFixed(3) : null;
  const priceUsd =
    nft.price && solPriceUsd ? (nft.price * solPriceUsd).toFixed(2) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Overlay className="nft-dialog-overlay" />
      <Dialog.Content className="nft-dialog-content">
        <button className="close-button" onClick={onClose}>{t('close')}</button>
        <div className="nft-modal-vertical">
          <div
            className={`market-card nft-modal-card market-card--${variant.name} nft-modal-image-container`}
          >
            <img src={nft.image} alt={nft.name} className="market-nft-img modal-nft-img" />
          </div>
          <div className="nft-modal-info">
            <div className="nft-info-pills">
              <span
                className="nft-info-pill rank"
                style={{
                  borderColor: rankVariant?.border,
                  background: rankVariant?.bg,
                }}
              >
                {nft.rank !== null ? `#${nft.rank}` : '--'}
              </span>
              <span
                className="nft-info-pill id"
                style={{
                  borderColor: variant.border,
                  background: variant.bg,
                }}
              >
                {nft.id.slice(0, 4)}
              </span>
              <span
                className="nft-info-pill name"
                style={{
                  borderColor: variant.border,
                  background: variant.bg,
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={nft.name}
              >
                {nft.name}
              </span>
            </div>
            {nft.attributes && nft.attributes.length > 0 && (
              <ul className="nft-attributes">
                {nft.attributes.slice(0, 6).map((attr, i) => (
                  <li key={i}>
                    <strong>{attr.trait_type}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <TransactionCard
            priceSol={priceSol}
            priceUsd={priceUsd}
            onBuy={onClose}
            variantBg={variant.bg}
            variantBorder={variant.border}
          />
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NFTCard;
