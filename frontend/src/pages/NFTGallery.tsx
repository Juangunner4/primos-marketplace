import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAssetsByCollection, HeliusNFT } from "../utils/helius";
import { getMagicEdenStats } from "../utils/magiceden";
import { getPythSolPrice } from "../utils/pyth";
import logo from "../images/primoslogo.png";
import { useTranslation } from "react-i18next";
import { CARD_VARIANTS, getRandomCardVariantName } from "../utils/cardVariants";
import TraitStats from "../components/TraitStats";
import NFTCard, { MarketNFT } from "../components/NFTCard";
import "./PrimosMarketGallery.css";

interface GalleryNFT extends HeliusNFT {
  variant: string;
}

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
        const assetsWithVariants = assets.map((nft) => ({
          ...nft,
          variant: getRandomCardVariantName(),
        }));
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
          const variant =
            CARD_VARIANTS.find((v) => v.name === nft.variant) ||
            CARD_VARIANTS[0];
          return (
            <li
              key={nft.id}
              className={`market-card market-card--${variant.name}`}
              tabIndex={0}
              role="button"
              onClick={() => {
                const mNft: MarketNFT = {
                  id: nft.id,
                  image: nft.image,
                  name: nft.name,
                  price: 0,
                  variant: nft.variant,
                  rank: null,
                  attributes: nft.attributes,
                };
                setSelectedNft(mNft);
                setCardOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const mNft: MarketNFT = {
                    id: nft.id,
                    image: nft.image,
                    name: nft.name,
                    price: 0,
                    variant: nft.variant,
                    rank: null,
                    attributes: nft.attributes,
                  };
                  setSelectedNft(mNft);
                  setCardOpen(true);
                }
              }}
            >
              <span className="market-prefix">{nft.id.slice(0, 4)}</span>
              <img src={nft.image} alt={nft.name} className="market-nft-img" />
              <div className="market-card-content">
                <h3 className="market-nft-name">{nft.name}</h3>
                <span className="market-nft-price">
                  {nft.listed ? t("listed") : t("not_listed")}
                </span>
              </div>
            </li>
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
            top: 0,
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
