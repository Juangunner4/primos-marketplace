import React, { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { calculateFees } from '../utils/fees';
import './PriceBreakdown.css';

interface PriceBreakdownProps {
  price: number;
  solPriceUsd?: number | null;
  expandable?: boolean;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ price, solPriceUsd, expandable = true }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const fees = calculateFees(price);
  const total = price + fees.totalFees;
  const usd = solPriceUsd ? (total * solPriceUsd).toFixed(2) : null;

  return (
    <div className="price-breakdown">
      <button
        className="price-summary"
        type="button"
        onClick={expandable ? () => setOpen(!open) : undefined}
        aria-expanded={expandable ? open : undefined}
        disabled={!expandable}
      >
        {total.toFixed(3)} SOL
        {usd && <span className="usd"> (${usd})</span>}
        {expandable && (
          <ExpandMoreIcon
            className={`arrow ${open ? 'open' : ''}`}
            fontSize="small"
            data-testid="expand-arrow"
          />
        )}
      </button>
      {expandable && open && (
        <div className="fee-details">
          <span>{t('list_price')}: {price.toFixed(3)} SOL</span>
          <span>{t('market_taker_fee')} (2%): {fees.marketTaker.toFixed(4)} SOL</span>
          <span>{t('creator_royalty_fee')} (5%): {fees.creatorRoyalty.toFixed(4)} SOL</span>
          <span>{t('community_fee')} (2.4%): {fees.community.toFixed(4)} SOL</span>
          <span>{t('operations_fee')} (1.4%): {fees.operations.toFixed(4)} SOL</span>
          <span>{t('seller_receives')}: {fees.sellerReceives.toFixed(3)} SOL</span>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
