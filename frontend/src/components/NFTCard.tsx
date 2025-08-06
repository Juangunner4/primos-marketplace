import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import "./NFTCard.css";
import { CARD_VARIANTS } from "../utils/cardVariants";
import TransactionCard from "./TransactionCard";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

export type MarketNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
  attributes?: { trait_type: string; value: string }[];
  tokenAta?: string;
  seller?: string;
  auctionHouse?: string;
  sellerReferral?: string;
  sellerExpiry?: number;
  // Enhanced with CoinGecko backup data
  collectionData?: {
    floorPrice?: string;
    marketCap?: string;
    volume24h?: string;
    totalSupply?: string;
    uniqueHolders?: string;
  };
};

interface NFTCardProps {
  nft: MarketNFT | null;
  open: boolean;
  onClose: () => void;
  onBuy?: () => void;
  solPriceUsd?: number;
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
  let rankVariant = CARD_VARIANTS.find((v) => v.name === "bronze");
  if (nft.rank !== null && nft.rank <= 100) {
    rankVariant = CARD_VARIANTS.find((v) => v.name === "gold");
  } else if (nft.rank !== null && nft.rank <= 500) {
    rankVariant = CARD_VARIANTS.find((v) => v.name === "silver");
  }
  const priceSol = nft.price ? nft.price.toFixed(3) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Overlay className="nft-dialog-overlay" />
      <Dialog.Content className="nft-dialog-content">
        <Dialog.Title className="dialog-title">{nft.name}</Dialog.Title>
        <button
          className="close-button"
          onClick={onClose}
          aria-label={t("close")}
        >
          <CloseIcon fontSize="medium" />
        </button>
        <Dialog.Description asChild>
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
          <Box
            className="nft-modal-image-container"
            sx={{
              width: { xs: "100%", md: "32%" },
              maxWidth: { xs: "100%", md: 320 },
              minWidth: { xs: "auto", md: 220 },
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              margin: 0,
              padding: 0,
              mb: { xs: 2, md: 0 },
            }}
          >
            <img src={nft.image} alt={nft.name} className="modal-nft-img" />
          </Box>
          <Box
            className="nft-modal-attributes-panel"
          >
            <div className="nft-info-pill-group">
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
                }}
                title={nft.name}
              >
                {nft.name}
              </span>
            </div>
            {nft.attributes && nft.attributes.length > 0 && (
              <ul className="nft-attributes">
                {nft.attributes.map((attr) => (
                  <li key={`${attr.trait_type}-${attr.value}`}>
                    <strong>{attr.trait_type}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            )}
            
            {/* CoinGecko Collection Data */}
            {nft.collectionData && (
              <Box sx={{ mt: 2, width: '100%' }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, mb: 1, color: '#4169e1' }}>
                  {t('nft_collection_data')}
                </Typography>
                <div className="collection-data-grid">
                  {nft.collectionData.floorPrice && (
                    <div className="collection-data-item">
                      <span className="collection-data-label">{t('collection_floor_price')}:</span>
                      <span className="collection-data-value">{nft.collectionData.floorPrice}</span>
                    </div>
                  )}
                  {nft.collectionData.marketCap && (
                    <div className="collection-data-item">
                      <span className="collection-data-label">{t('collection_market_cap')}:</span>
                      <span className="collection-data-value">{nft.collectionData.marketCap}</span>
                    </div>
                  )}
                  {nft.collectionData.volume24h && (
                    <div className="collection-data-item">
                      <span className="collection-data-label">{t('collection_volume_24h')}:</span>
                      <span className="collection-data-value">{nft.collectionData.volume24h}</span>
                    </div>
                  )}
                  {nft.collectionData.totalSupply && (
                    <div className="collection-data-item">
                      <span className="collection-data-label">{t('collection_total_supply')}:</span>
                      <span className="collection-data-value">{nft.collectionData.totalSupply}</span>
                    </div>
                  )}
                  {nft.collectionData.uniqueHolders && (
                    <div className="collection-data-item">
                      <span className="collection-data-label">{t('collection_unique_holders')}:</span>
                      <span className="collection-data-value">{nft.collectionData.uniqueHolders}</span>
                    </div>
                  )}
                </div>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666', fontSize: '0.75rem' }}>
                  {t('coingecko_backup')}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            className="nft-modal-actions-panel"
            sx={{
              width: { xs: "100%", md: "32%" },
              maxWidth: { xs: "100%", md: 320 },
              display: "flex",
            }}
          >
            <TransactionCard
              priceSol={priceSol}
              solPriceUsd={solPriceUsd}
              onBuy={onBuy || onClose}
              variantBg={variant.bg}
              variantBorder={variant.border}
              buyLabel={buyLabel}
            />
          </Box>
        </Box>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NFTCard;
