import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import "./NFTCard.css";
import { CARD_VARIANTS } from "../utils/cardVariants";
import TransactionCard from "./TransactionCard";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";

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
  onBuy?: () => void;
  solPriceUsd?: number; // Optionally pass SOL price in USD for conversion
  buyLabel?: string;
}

const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  open,
  onClose,
  onBuy,
  solPriceUsd,
  buyLabel,
}) => {
  const { t } = useTranslation();
  if (!nft) return null;
  const variant =
    CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
  // Add rankVariant logic
  let rankVariant = CARD_VARIANTS.find((v) => v.name === "bronze");
  if (nft.rank !== null && nft.rank <= 100) {
    rankVariant = CARD_VARIANTS.find((v) => v.name === "gold");
  } else if (nft.rank !== null && nft.rank <= 500) {
    rankVariant = CARD_VARIANTS.find((v) => v.name === "silver");
  }
  const priceSol = nft.price ? nft.price.toFixed(3) : null;
  const priceUsd =
    nft.price && solPriceUsd ? (nft.price * solPriceUsd).toFixed(2) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Overlay className="nft-dialog-overlay" />
      <Dialog.Content className="nft-dialog-content">
        <button
          className="close-button"
          onClick={onClose}
          aria-label={t("close")}
        >
          <CloseIcon fontSize="medium" />
        </button>
        <Box
          className="nft-modal-vertical"
          sx={{
            display: { xs: "block", md: "flex" },
            flexDirection: { md: "row" },
            alignItems: { md: "flex-start" },
            gap: { md: 3 },
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* 3. Action Buttons */}
          <Box
            className="nft-modal-actions-panel"
            sx={{
              width: { md: "32%" },
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              paddingLeft: { md: "1rem" },
            }}
          >
            <TransactionCard
              priceSol={priceSol}
              priceUsd={priceUsd}
              onBuy={onBuy || onClose}
              variantBg={variant.bg}
              variantBorder={variant.border}
              buyLabel={buyLabel}
            />
          </Box>
          {/* 1. NFT Image */}
          <Box
            className="nft-modal-image-container"
            sx={{
              width: { md: "32%" },
              maxWidth: 320,
              minWidth: 220,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              margin: 0,
              padding: 0,
            }}
          >
            <img src={nft.image} alt={nft.name} className="modal-nft-img" />
          </Box>
                    {/* 2. Attributes & Info */}
          <Box
            className="nft-modal-attributes-panel"
            sx={{
              width: { md: "36%" },
              maxWidth: 340,
              padding: { md: "0 1rem" },
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
            }}
          >
            <div className="nft-info-pills">
              <span
                className="nft-info-pill rank"
                style={{
                  borderColor: rankVariant?.border,
                  background: rankVariant?.bg,
                }}
              >
                {nft.rank !== null ? `#${nft.rank}` : "--"}
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
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
          </Box>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NFTCard;
