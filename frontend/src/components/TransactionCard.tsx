import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@mui/material/Button";
import "./TransactionCard.css";
import { calculateFees } from "../utils/fees";

interface TransactionCardProps {
  priceSol: string | null;
  priceUsd?: string | null;
  onBuy: () => void;
  variantBg: string;
  variantBorder: string;
  buyLabel?: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  priceSol,
  priceUsd,
  onBuy,
  variantBg,
  variantBorder,
  buyLabel,
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:700px)");
  const feeDetails = priceSol ? calculateFees(parseFloat(priceSol)) : null;
  const sellerAmount = feeDetails ? feeDetails.sellerReceives.toFixed(3) : null;
  const totalPrice = feeDetails
    ? (parseFloat(priceSol as string) + feeDetails.totalFees).toFixed(3)
    : null;

  if (isMobile) {
    return (
      <>
        <Card
          className="transaction-card-mobile"
          style={{ border: `2px solid ${variantBorder}`, height: "fit-content" }}
        >
          <CardContent className="transaction-card-mobile-content">
            <Typography sx={{ fontWeight: 700, right: 0 }} variant="subtitle2" color="text.secondary">
              {t('total_price')}
            </Typography>
            {priceSol ? (
              <>
                <Box display="flex" alignItems="baseline" gap={1}>
                  <Typography sx={{ fontSize: '1rem', textAlign: 'right' }} variant="h5" fontWeight="bold">
                    {totalPrice} SOL
                  </Typography>
                  {priceUsd && (
                    <Typography sx={{ fontSize: '1rem', textAlign: 'right' }} variant="body2" color="text.secondary">
                      (${priceUsd})
                    </Typography>
                  )}
                </Box>
                <div className="fee-details">
                  <span>{t('list_price')}: {priceSol} SOL</span>
                  <span>{t('market_taker_fee')} (2%): {feeDetails?.marketTaker.toFixed(4)} SOL</span>
                  <span>{t('creator_royalty_fee')} (5%): {feeDetails?.creatorRoyalty.toFixed(4)} SOL</span>
                  <span>{t('community_fee')} (3%): {feeDetails?.community.toFixed(4)} SOL</span>
                  <span>{t('operations_fee')} (1.5%): {feeDetails?.operations.toFixed(4)} SOL</span>
                  {sellerAmount && (
                    <span>{t('seller_receives')}: {sellerAmount} SOL</span>
                  )}
                </div>
              </>
            ) : (
              <Typography variant="h6">{t("market_no_price")}</Typography>
            )}
          </CardContent>
        </Card>
        <Card
          className="transaction-card-mobile"
          style={{ border: `2px solid ${variantBorder}`, padding: 0, margin: 0 }}
        >
          <CardContent className="transaction-card-mobile-content" sx={{ p: 1, flex: 1 }}>
            <Button
              fullWidth
              sx={{
                marginTop: '1rem',
                background: variantBg,
                borderColor: variantBorder,
                color: "#222",
                fontWeight: 'bold',
                fontSize: '0.9rem',
                height: 'auto',
                '&:hover': { background: variantBorder, color: '#fff' },
              }}
              onClick={onBuy}
            >
              {buyLabel || t("buy_now")}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="market-card-footer transaction-card-floating">
      {priceSol ? (
        <span
          className="market-nft-price-pill"
          style={{ background: variantBg, borderColor: variantBorder }}
        >
          {totalPrice} SOL
          {priceUsd && <span className="usd"> (${priceUsd})</span>}
        </span>
      ) : (
        <span
          className="market-nft-price-pill"
          style={{ background: variantBg, borderColor: variantBorder }}
        >
          {t("market_no_price")}
        </span>
      )}
      {priceSol && (
        <div className="fee-details">
          <span>{t('list_price')}: {priceSol} SOL</span>
          <span>{t('market_taker_fee')} (2%): {feeDetails?.marketTaker.toFixed(4)} SOL</span>
          <span>{t('creator_royalty_fee')} (5%): {feeDetails?.creatorRoyalty.toFixed(4)} SOL</span>
          <span>{t('community_fee')} (3%): {feeDetails?.community.toFixed(4)} SOL</span>
          <span>{t('operations_fee')} (1.5%): {feeDetails?.operations.toFixed(4)} SOL</span>
          {sellerAmount && (
            <span>{t('seller_receives')}: {sellerAmount} SOL</span>
          )}
        </div>
      )}
      <div className="transaction-card-buttons">
        <button
          className="buy-button"
          style={{
            background: variantBg,
            borderColor: variantBorder,
            color: "#222",
          }}
          onClick={onBuy}
        >
          {buyLabel || t("buy_now")}
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
