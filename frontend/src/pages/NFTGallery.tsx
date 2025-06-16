import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAssetsByCollection, getNFTByTokenAddress } from "../utils/helius";
import { getMagicEdenStats } from "../utils/magiceden";
import { getPythSolPrice } from "../utils/pyth";
import logo from "../images/primoslogo.png";
import { useTranslation } from "react-i18next";
import { CARD_VARIANTS, getRandomCardVariantName } from "../utils/cardVariants";
import TraitStats from "../components/TraitStats";
import NFTCard, { MarketNFT } from "../components/NFTCard";
import "./PrimosMarketGallery.css";
import * as Dialog from "@radix-ui/react-dialog";
import { Card, CardActionArea, CardMedia, CardActions, Button, Typography, Box } from "@mui/material";

type GalleryNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
  attributes?: { trait_type: string; value: string }[];
};

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;
const MAGICEDEN_SYMBOL = "primos";
const NFTGallery: React.FC = () => {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<GalleryNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [selectedNft, setSelectedNft] = useState<MarketNFT | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const { t } = useTranslation();

  const handleList = () => {
    setCardOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setNfts([]);
        setLoading(false);
        setFloorPrice(null);
        setSolPrice(null);
        return;
      }
      const pub = publicKey.toBase58();
      setLoading(true);
      try {
        const [assets, stats, solPriceVal] = await Promise.all([
          getAssetsByCollection(PRIMO_COLLECTION, pub),
          getMagicEdenStats(MAGICEDEN_SYMBOL),
          getPythSolPrice(),
        ]);
        const assetsWithVariants = await Promise.all(
          assets.map(async (nft) => {
            const meta = await getNFTByTokenAddress(nft.id);
            return {
              ...nft,
              variant: getRandomCardVariantName(),
              price: 0, // Ensure price exists
              rank: null, // Ensure rank exists
              attributes: meta?.attributes,
            } as GalleryNFT;
          })
        );
        setNfts(assetsWithVariants);
        setFloorPrice(stats?.floorPrice ?? null);
        setSolPrice(solPriceVal ?? null);
      } catch (e) {
        console.error("Failed to load NFTs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="nft-connect-wrapper">
        <img src={logo} alt={t('logo_alt')} className="nft-logo" />
        <p className="connect-text">{t("connect_wallet")}</p>
      </div>
    );
  }

  // Calculate total value in USD (if you have solPrice)
  const totalValueUSD =
    floorPrice && solPrice
      ? (nfts.length * (floorPrice / 1e9) * solPrice).toLocaleString(
        undefined,
        { style: "currency", currency: "USD", maximumFractionDigits: 2 },
      )
      : "--";

  let galleryContent;
  if (loading) {
    galleryContent = (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>{t("loading_nfts")}</span>
      </div>
    );
  } else if (nfts.length === 0) {
    galleryContent = <p className="no-nfts">{t("no_nfts")}</p>;
  } else {
    galleryContent = (
      <ul className="nft-gallery-grid market-nft-list nft-list">
        {nfts.map((nft) => {
          const variant = CARD_VARIANTS.find((v) => v.name === nft.variant) || CARD_VARIANTS[0];
          const priceSol = nft.price ? nft.price.toFixed(3) : null;
          const priceUsd = nft.price && solPrice ? (nft.price * solPrice).toFixed(2) : null;

          // Determine rank variant
          let rankVariant = CARD_VARIANTS.find(v => v.name === 'bronze');
          if (nft.rank !== null && nft.rank <= 100) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'gold');
          } else if (nft.rank !== null && nft.rank <= 500) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'silver');
          }

          return (
            <Dialog.Root open={selectedNft?.id === nft.id && cardOpen} onOpenChange={(open) => {
              setCardOpen(open);
              if (!open) setSelectedNft(null);
            }} key={nft.id}>
              <Dialog.Trigger asChild>
                <Card>
                  <CardActionArea
                    onClick={() => {
                      setSelectedNft(nft);
                      setCardOpen(true);
                    }}
                  >
                    {/* Rank pill: top-left */}
                    <Box sx={{
                      position: 'absolute', top: 14, left: 14, zIndex: 2,
                      background: rankVariant?.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
                    }}>
                      {nft.rank !== null ? `#${nft.rank}` : '--'}
                    </Box>
                    {/* ID pill: top-right */}
                    <Box sx={{
                      position: 'absolute', top: 14, right: 14, zIndex: 2,
                      background: variant.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '1rem'
                    }}>
                      {nft.id.slice(0, 4)}
                    </Box>
                    {/* NFT Image */}
                    <CardMedia
                      component="img"
                      image={nft.image}
                      alt={nft.name}
                    />
                    {/* Name pill: below image, centered */}
                    <Typography sx={{
                      position: 'absolute', bottom: -5, left: 5, zIndex: 2,
                      background: variant.bg,
                      borderRadius: 2, px: 1.2, py: 0.3, fontWeight: 700, fontSize: '0.85rem'
                    }}
                    >
                      {nft.name}
                    </Typography>
                  </CardActionArea>
                  <CardActions sx={{ flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {priceSol ? (
                      <Box
                        sx={{
                          background: variant.bg,
                          border: `2px solid ${variant.border}`,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          color: '#1a202c',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          justifyContent: 'center',
                          alignSelf: 'center',
                        }}
                      >
                        {priceSol} SOL
                        {priceUsd && (
                          <span style={{ fontSize: '0.92em', color: '#444', fontWeight: 500, marginLeft: '0.18em', opacity: 0.85 }}>
                            (${priceUsd})
                          </span>
                        )}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          background: variant.bg,
                          border: `2px solid ${variant.border}`,
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          color: '#1a202c',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          justifyContent: 'center',
                          alignSelf: 'center',
                        }}
                      >
                        {t('market_no_price')}
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        background: variant.bg,
                        color: '#222',
                        fontWeight: 700,
                        border: `2px solid ${variant.border}`,
                        boxShadow: 'none',
                        '&:hover': {
                          background: variant.border,
                          color: '#fff',
                        },
                      }}
                    >
                      {t('list')}
                    </Button>
                  </CardActions>
                </Card>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay style={{
                  background: 'rgba(0,0,0,0.55)',
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} />
              </Dialog.Portal>
            </Dialog.Root>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      {cardOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 1200,
            top: 15,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <NFTCard
            nft={selectedNft}
            open={cardOpen}
            onClose={() => setCardOpen(false)}
            onBuy={handleList}
            buyLabel={t("list")}
            solPriceUsd={solPrice ?? undefined}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          filter: cardOpen ? "blur(2px)" : "none",
          opacity: cardOpen ? 0.4 : 1,
          pointerEvents: cardOpen ? "none" : "auto",
          transition: "opacity 0.2s, filter 0.2s",
        }}
      >
        {/* Something for Primos here */}
        {/* {!filterOpen && (
        <IconButton
          aria-label={t('open_filters')}
          onClick={() => setFilterOpen(true)}
          sx={{
            border: '1px solid #bbb',
            borderRadius: 3,
            boxShadow: '4px 0 24px rgba(226, 194, 117, 0.08)',
            background: '#f5f5f8',
            margin: '0 10px 0 10px',
          }}
        >
          <CompareArrowsIcon />
        </IconButton>
      )} */}
        <div className="market-gallery" style={{ flex: 1 }}>
          <div className="market-header-row">
            <h2 className="market-title">{t("your_primos_nfts")}</h2>
            <div className="nft-gallery-stats market-stats-pills">
              <span className="market-pill">
                {t("floor_price")}:{" "}
                {floorPrice !== null
                  ? `${(floorPrice / 1e9).toFixed(2)}`
                  : "--"}
              </span>
              <span className="market-pill">
                {t("owned")}: {nfts.length}
              </span>
              <span className="market-pill">
                {t("sol_price")}:{" "}
                {solPrice !== null ? `$${solPrice.toFixed(2)}` : "--"}
              </span>
              <span className="market-pill">
                {t("total_value")}: {totalValueUSD}
              </span>
            </div>
          </div>
          {galleryContent}
        </div>
        <TraitStats nftIds={nfts.map((n) => n.id)} />
      </div>
    </>
  );
};

export default NFTGallery;
