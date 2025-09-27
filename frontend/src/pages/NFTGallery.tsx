import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAssetsByCollection, getNFTByTokenAddress } from "../utils/helius";
import { getMagicEdenStats } from "../utils/magiceden";
import { getPythSolPrice } from "../utils/pyth";
import { getNftRank } from "../utils/nft";
import logo from "../images/weyslogo.png";
import { useTranslation } from "react-i18next";
import { CARD_VARIANTS, getRandomCardVariantName } from "../utils/cardVariants";
import TraitStats from "../components/TraitStats";
import NFTCard, { MarketNFT } from "../components/NFTCard";
import api from '../utils/api';
import MessageModal from '../components/MessageModal';
import ListItemModal from '../components/ListItemModal';
import AdminDeveloperConsole from '../components/AdminDeveloperConsole';
import { AppMessage } from '../types';
import "./WeysMarketGallery.css";
import * as Dialog from "@radix-ui/react-dialog";
import { Card, CardActionArea, CardMedia, CardActions, Button, Typography, Box, Tooltip, IconButton } from "@mui/material";
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import { WEYS_COLLECTION_SYMBOL } from '../constants/collection';

type GalleryNFT = {
  id: string;
  image: string;
  name: string;
  price: number;
  variant: string;
  rank: number | null;
  attributes?: { trait_type: string; value: string }[];
};

const WEY_COLLECTION = process.env.REACT_APP_WEYS_COLLECTION!;
const MAGICEDEN_SYMBOL = WEYS_COLLECTION_SYMBOL;
const NFTGallery: React.FC = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [nfts, setNfts] = useState<GalleryNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const [selectedNft, setSelectedNft] = useState<MarketNFT | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, { stlUrl?: string }>>({});
  const { t } = useTranslation();
  const [message, setMessage] = useState<AppMessage | null>(null);

  // Debug info for AdminDeveloperConsole
  const [debugInfo, setDebugInfo] = useState({
    apiCallAttempted: false,
    apiCallSuccess: false,
    apiCallError: null as string | null,
    contractsLoaded: 0,
    usersLoaded: 0,
    renderAttempted: true,
    lastError: null as Error | null,
    networkErrors: [] as { url: string; status?: number; message: string }[],
    heliusCallDetails: {
      assetsRequested: 0,
      assetsReceived: 0,
      assetsWithImages: 0,
      assetsWithoutImages: 0,
      assetsWithMetadata: 0,
      assetsWithoutMetadata: 0,
      assetsWithAttributes: 0,
      assetsWithoutAttributes: 0,
      metadataCallsAttempted: 0,
      metadataCallsSuccessful: 0,
      metadataCallsFailed: 0,
      missingDataBreakdown: {
        noImage: [] as string[],
        noMetadata: [] as string[],
        noAttributes: [] as string[],
        noName: [] as string[],
        noRank: [] as string[]
      },
      apiEndpoints: [] as string[],
      performanceMetrics: {
        totalFetchTime: 0,
        assetsFetchTime: 0,
        metadataFetchTime: 0,
        statsFetchTime: 0,
        solPriceFetchTime: 0
      }
    }
  });

  const handleList = (nft: MarketNFT) => {
    setSelectedNft(nft);
    setCardOpen(false);
    setListOpen(true);
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setNfts([]);
        setLoading(false);
        setFloorPrice(null);
        setSolPrice(null);
        setDebugInfo(prev => ({ 
          ...prev, 
          apiCallAttempted: false, 
          apiCallSuccess: false,
          heliusCallDetails: {
            ...prev.heliusCallDetails,
            assetsRequested: 0,
            assetsReceived: 0,
            missingDataBreakdown: {
              noImage: [],
              noMetadata: [],
              noAttributes: [],
              noName: [],
              noRank: []
            }
          }
        }));
        return;
      }
      const pub = publicKey.toBase58();
      setLoading(true);
      
      const startTime = performance.now();
      
      setDebugInfo(prev => ({ 
        ...prev, 
        apiCallAttempted: true, 
        apiCallError: null,
        lastError: null,
        heliusCallDetails: {
          ...prev.heliusCallDetails,
          apiEndpoints: ['getAssetsByCollection', 'getMagicEdenStats', 'getPythSolPrice', 'getNFTByTokenAddress'],
          missingDataBreakdown: {
            noImage: [],
            noMetadata: [],
            noAttributes: [],
            noName: [],
            noRank: []
          }
        }
      }));
      
      try {
        const assetsStartTime = performance.now();
        const assets = await getAssetsByCollection(WEY_COLLECTION, pub);
        const assetsEndTime = performance.now();
        
        const statsStartTime = performance.now();
        const stats = await getMagicEdenStats(MAGICEDEN_SYMBOL);
        const statsEndTime = performance.now();
        
        const solPriceStartTime = performance.now();
        const solPriceVal = await getPythSolPrice();
        const solPriceEndTime = performance.now();
        
        // Track initial asset data
        const assetsRequested = 1; // We request all assets for the collection
        const assetsReceived = assets?.length || 0;
        let assetsWithImages = 0;
        let assetsWithoutImages = 0;
        let metadataCallsAttempted = 0;
        let metadataCallsSuccessful = 0;
        let metadataCallsFailed = 0;
        let assetsWithMetadata = 0;
        let assetsWithoutMetadata = 0;
        let assetsWithAttributes = 0;
        let assetsWithoutAttributes = 0;

        const missingData = {
          noImage: [] as string[],
          noMetadata: [] as string[],
          noAttributes: [] as string[],
          noName: [] as string[],
          noRank: [] as string[]
        };

        const metadataStartTime = performance.now();
        const pageNFTs = await Promise.all(
          assets.map(async (asset: any) => {
            metadataCallsAttempted++;
            let meta = null;
            
            try {
              meta = await getNFTByTokenAddress(asset.id);
              metadataCallsSuccessful++;
              if (meta) {
                assetsWithMetadata++;
              } else {
                assetsWithoutMetadata++;
                missingData.noMetadata.push(asset.id);
              }
            } catch (e) {
              metadataCallsFailed++;
              assetsWithoutMetadata++;
              missingData.noMetadata.push(asset.id);
            }

            const image = asset.img ?? asset.image ?? asset.extra?.img ?? meta?.image ?? '';
            const name = asset.name ?? asset.title ?? meta?.name ?? asset.id;
            const metaAttrs = meta?.attributes;
            const rank = getNftRank(asset, metaAttrs);

            // Track missing data
            if (!image) {
              assetsWithoutImages++;
              missingData.noImage.push(asset.id);
            } else {
              assetsWithImages++;
            }

            if (!name || name === asset.id) {
              missingData.noName.push(asset.id);
            }

            if (!metaAttrs || metaAttrs.length === 0) {
              assetsWithoutAttributes++;
              missingData.noAttributes.push(asset.id);
            } else {
              assetsWithAttributes++;
            }

            if (rank === null) {
              missingData.noRank.push(asset.id);
            }

            return {
              id: asset.id,
              image,
              name,
              price: 0,
              variant: getRandomCardVariantName(),
              rank,
              attributes: metaAttrs,
            };
          })
        );
        const metadataEndTime = performance.now();

        const filtered = pageNFTs.filter((nft) => nft.image);
        const totalEndTime = performance.now();

        setNfts(filtered);
        setFloorPrice(stats?.floorPrice ?? null);
        setSolPrice(solPriceVal ?? null);
        setDebugInfo(prev => ({ 
          ...prev, 
          apiCallSuccess: true, 
          contractsLoaded: filtered.length,
          usersLoaded: 1,
          lastError: null,
          heliusCallDetails: {
            ...prev.heliusCallDetails,
            assetsRequested,
            assetsReceived,
            assetsWithImages,
            assetsWithoutImages,
            assetsWithMetadata,
            assetsWithoutMetadata,
            assetsWithAttributes,
            assetsWithoutAttributes,
            metadataCallsAttempted,
            metadataCallsSuccessful,
            metadataCallsFailed,
            missingDataBreakdown: missingData,
            performanceMetrics: {
              totalFetchTime: Math.round(totalEndTime - startTime),
              assetsFetchTime: Math.round(assetsEndTime - assetsStartTime),
              metadataFetchTime: Math.round(metadataEndTime - metadataStartTime),
              statsFetchTime: Math.round(statsEndTime - statsStartTime),
              solPriceFetchTime: Math.round(solPriceEndTime - solPriceStartTime)
            }
          }
        }));
      } catch (e) {
        console.error("Failed to load NFTs", e);
        setDebugInfo(prev => ({ 
          ...prev, 
          apiCallSuccess: false, 
          apiCallError: e instanceof Error ? e.message : 'Unknown error',
          lastError: e instanceof Error ? e : new Error('Unknown error')
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [publicKey]);

  useEffect(() => {
    const load = async () => {
      const map: Record<string, { stlUrl?: string }> = {};
      for (const nft of nfts) {
        try {
          const res = await api.get(`/api/wey3d/${nft.id}`);
          if (res.data?.stlUrl) map[nft.id] = { stlUrl: res.data.stlUrl };
        } catch {}
      }
      setStatuses(map);
    };
    if (nfts.length) load();
  }, [nfts]);

  if (!publicKey) {
    return (
      <div className="nft-connect-wrapper">
        <img src={logo} alt={t('logo_alt')} className="nft-logo" />
        <p className="connect-text">{t("connect_wallet")}</p>
      </div>
    );
  }

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

          let rankVariant = CARD_VARIANTS.find(v => v.name === 'bronze');
          if (nft.rank !== null && nft.rank <= 100) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'gold');
          } else if (nft.rank !== null && nft.rank <= 500) {
            rankVariant = CARD_VARIANTS.find(v => v.name === 'silver');
          }

          return (
            <Dialog.Root
              open={selectedNft?.id === nft.id && cardOpen}
              onOpenChange={(open) => {
                setCardOpen(open);
                if (!open) setSelectedNft(null);
              }}
              key={nft.id}
            >
              <Card>
                <Dialog.Trigger asChild>
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
                    {statuses[nft.id]?.stlUrl && (
                      <Tooltip title={t('download_3d')}>
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 14, right: 50, zIndex: 2, background: '#fff' }}
                          aria-label="3d-download"
                          onClick={(e) => { e.stopPropagation(); window.open(statuses[nft.id]!.stlUrl, '_blank'); }}
                        >
                          <ThreeDRotationIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
                </Dialog.Trigger>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleList(nft);
                      }}
                    >
                      {t('list')}
                    </Button>
                  </CardActions>
              </Card>
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
      <AdminDeveloperConsole 
        debugInfo={debugInfo}
        componentName="NFTGallery (Collected)"
        additionalData={{
          loading,
          nftsCount: nfts.length,
          hasFloorPrice: !!floorPrice,
          floorPriceValue: floorPrice,
          hasSolPrice: !!solPrice,
          solPriceValue: solPrice,
          statusesLoaded: Object.keys(statuses).length,
          totalValueUSD: solPrice && floorPrice ? (nfts.length * (floorPrice / 1e9) * solPrice).toFixed(2) : null,
          cardOpen,
          listOpen,
          selectedNftId: selectedNft?.id,
          environmentVars: {
            weyCollection: !!WEY_COLLECTION,
            weyCollectionValue: WEY_COLLECTION,
            magicEdenSymbol: MAGICEDEN_SYMBOL
          },
          heliusDebugData: {
            collectionId: WEY_COLLECTION,
            walletAddress: publicKey?.toBase58(),
            assetsRequested: debugInfo.heliusCallDetails.assetsRequested,
            assetsReceived: debugInfo.heliusCallDetails.assetsReceived,
            assetsFiltered: nfts.length,
            assetsRejected: debugInfo.heliusCallDetails.assetsReceived - nfts.length,
            dataCompleteness: {
              withImages: `${debugInfo.heliusCallDetails.assetsWithImages}/${debugInfo.heliusCallDetails.assetsReceived}`,
              withMetadata: `${debugInfo.heliusCallDetails.assetsWithMetadata}/${debugInfo.heliusCallDetails.assetsReceived}`,
              withAttributes: `${debugInfo.heliusCallDetails.assetsWithAttributes}/${debugInfo.heliusCallDetails.assetsReceived}`,
              metadataCallSuccess: `${debugInfo.heliusCallDetails.metadataCallsSuccessful}/${debugInfo.heliusCallDetails.metadataCallsAttempted}`
            },
            missingDataSummary: {
              noImageCount: debugInfo.heliusCallDetails.missingDataBreakdown.noImage.length,
              noMetadataCount: debugInfo.heliusCallDetails.missingDataBreakdown.noMetadata.length,
              noAttributesCount: debugInfo.heliusCallDetails.missingDataBreakdown.noAttributes.length,
              noNameCount: debugInfo.heliusCallDetails.missingDataBreakdown.noName.length,
              noRankCount: debugInfo.heliusCallDetails.missingDataBreakdown.noRank.length,
              noImageTokens: debugInfo.heliusCallDetails.missingDataBreakdown.noImage.slice(0, 5).map(id => id.slice(0, 8) + '...'),
              noMetadataTokens: debugInfo.heliusCallDetails.missingDataBreakdown.noMetadata.slice(0, 5).map(id => id.slice(0, 8) + '...'),
              noAttributesTokens: debugInfo.heliusCallDetails.missingDataBreakdown.noAttributes.slice(0, 5).map(id => id.slice(0, 8) + '...')
            },
            performanceMetrics: debugInfo.heliusCallDetails.performanceMetrics,
            apiEndpoints: debugInfo.heliusCallDetails.apiEndpoints
          }
        }}
      />
      {cardOpen && (
        <div
          className="nft-modal-wrapper"
          style={{ zIndex: 1200 }}
        >
          <NFTCard
            nft={selectedNft}
            open={cardOpen}
            onClose={() => setCardOpen(false)}
            onBuy={() => selectedNft && handleList(selectedNft)}
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
        
        <div className="market-gallery" style={{ flex: 1 }}>
          <div className="market-header-row">
            <h2 className="market-title">{t("your_weys_nfts")}</h2>
            <div className="nft-gallery-stats market-stats-pills">
              <span className="market-pill">
                {`${t("floor_price")} (USD)`}:{" "}
                {floorPrice !== null && solPrice !== null
                  ? `$${((floorPrice / 1e9) * solPrice).toFixed(2)}`
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
    <ListItemModal
      open={listOpen}
      nft={selectedNft}
      onClose={() => setListOpen(false)}
      onConfirm={() => {
        setListOpen(false);
        setMessage({ text: t('coming_soon') });
      }}
    />
    <MessageModal
      open={!!message}
      message={message}
      onClose={() => setMessage(null)}
    />
  </>
  );
};

export default NFTGallery;
