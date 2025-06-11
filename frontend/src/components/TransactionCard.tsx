import React from 'react';
import { useTranslation } from 'react-i18next';
import './TransactionCard.css';


interface TransactionCardProps {
  priceSol: string | null;
  priceUsd?: string | null;
  onBuy: () => void;
  variantBg: string;
  variantBorder: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  priceSol,
  priceUsd,
  onBuy,
  variantBg,
  variantBorder,
}) => {
  const { t } = useTranslation();

  return (
    <div className="market-card-footer transaction-card-floating">
      {priceSol ? (
        <span
          className="market-nft-price-pill"
          style={{ background: variantBg, borderColor: variantBorder }}
        >
          {priceSol} SOL
          {priceUsd && <span className="usd"> (${priceUsd})</span>}
        </span>
      ) : (
        <span
          className="market-nft-price-pill"
          style={{ background: variantBg, borderColor: variantBorder }}
        >
          {t('market_no_price')}
        </span>
      )}
      <div className="transaction-card-buttons">
        <button
          className="buy-button"
          style={{ background: variantBg, borderColor: variantBorder, color: '#222' }}
          onClick={onBuy}
        >
          {t('buy_now')}
        </button>
        <button
          className="paywith-button"
          style={{ background: variantBg, borderColor: variantBorder, color: '#222' }}
        >
          {t('pay_with')}
        </button>
        <button
          className="offer-button"
          style={{ background: variantBg, borderColor: variantBorder, color: '#222' }}
        >
          {t('make_an_offer')}
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;