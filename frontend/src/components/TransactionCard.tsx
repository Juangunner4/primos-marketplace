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
  const sellerAmount = priceSol
    ? calculateFees(parseFloat(priceSol)).sellerReceives.toFixed(3)
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
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography sx={{ fontSize: "1rem", textAlign: "right" }} variant="h5" fontWeight="bold">
                  {priceSol} SOL
                </Typography>
                {priceUsd && (
                  <Typography sx={{ fontSize: "1rem", textAlign: "right" }} variant="body2" color="text.secondary">
                    (${priceUsd})
                  </Typography>
                )}
              </Box>
              {sellerAmount && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('seller_receives')}: {sellerAmount} SOL
                </Typography>
              )}
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
          {priceSol} SOL
          {priceUsd && <span className="usd"> (${priceUsd})</span>}
          {sellerAmount && (
            <span className="usd" style={{ display: 'block' }}>
              {t('seller_receives')}: {sellerAmount} SOL
            </span>
          )}
        </span>
      ) : (
        <span
          className="market-nft-price-pill"
          style={{ background: variantBg, borderColor: variantBorder }}
        >
          {t("market_no_price")}
        </span>
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
