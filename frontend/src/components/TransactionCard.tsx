import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@mui/material/Button";
import "./TransactionCard.css";
import PriceBreakdown from "./PriceBreakdown";

interface TransactionCardProps {
  priceSol: string | null;
  solPriceUsd?: number;
  onBuy: () => void;
  variantBg: string;
  variantBorder: string;
  buyLabel?: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  priceSol,
  solPriceUsd,
  onBuy,
  variantBg,
  variantBorder,
  buyLabel,
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:700px)");
  const priceNum = priceSol ? parseFloat(priceSol) : null;

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
            {priceNum !== null ? (
              <PriceBreakdown price={priceNum} solPriceUsd={solPriceUsd} />
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
      {priceNum !== null ? (
        <PriceBreakdown price={priceNum} solPriceUsd={solPriceUsd} />
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
