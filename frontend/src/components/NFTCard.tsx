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
        <div
          className={`market-card nft-modal-card market-card--${variant.name}`}
          style={{ margin: '0 auto' }}
        >
          {/* Rank pill: top-left */}
          <span
            className="market-prefix market-primo-number"
            style={{
              background: rankVariant?.bg,
              borderColor: rankVariant?.border,
              left: 12,
              right: 'auto',
              position: 'absolute',
              top: 12,
              zIndex: 2,
            }}
          >
            {nft.rank !== null ? `#${nft.rank}` : '--'}
          </span>
          {/* ID pill: top-right */}
          <span
            className="market-prefix market-primo-number"
            style={{
              background: variant.bg,
              borderColor: variant.border,
              right: 14,
              left: 'auto',
              position: 'absolute',
              top: 12,
              zIndex: 2,
            }}
          >
            {nft.id.slice(0, 4)}
          </span>
          <img src={nft.image} alt={nft.name} className="market-nft-img modal-nft-img" />
          {/* Name pill: below image, centered */}
          <span
            className="market-prefix market-primo-number"
            style={{
              background: variant.bg,
              borderColor: variant.border,
              position: 'relative',
              display: 'block',
              margin: '0.7rem auto 0.3rem auto',
              textAlign: 'center',
              zIndex: 1,
              maxWidth: '95%',
              fontSize: '1.08rem',
              fontWeight: 700,
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'unset',
              padding: '0.22rem 0.8rem',
              wordBreak: 'break-word',
              right: 50,
              left: 'unset',
              top: 'unset',
            }}
          >
            {nft.name}
          </span>
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
