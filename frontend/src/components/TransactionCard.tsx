import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import "./TransactionCard.css";

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
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:700px)");

  if (isMobile) {
    return (
      <Card
        sx={{ width: "100%", maxWidth: 340, border: `2px solid ${variantBorder}` }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Price
          </Typography>
          {priceSol ? (
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h5" fontWeight="bold">
                {priceSol} SOL
              </Typography>
              {priceUsd && (
                <Typography variant="body2" color="text.secondary">
                  (${priceUsd})
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="h6">{t("market_no_price")}</Typography>
          )}
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                background: variantBg,
                borderColor: variantBorder,
                color: "#222",
                '&:hover': { background: variantBorder, color: '#fff' },
              }}
              onClick={onBuy}
            >
              {buyLabel || t("buy_now")}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                background: variantBg,
                borderColor: variantBorder,
                color: "#222",
              }}
            >
              {t("pay_with")}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                background: variantBg,
                borderColor: variantBorder,
                color: "#222",
              }}
            >
              {t("make_an_offer")}
            </Button>
          </Box>
        </CardContent>
      </Card>
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
        <button
          className="paywith-button"
          style={{
            background: variantBg,
            borderColor: variantBorder,
            color: "#222",
          }}
        >
          {t("pay_with")}
        </button>
        <button
          className="offer-button"
          style={{
            background: variantBg,
            borderColor: variantBorder,
            color: "#222",
          }}
        >
          {t("make_an_offer")}
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
