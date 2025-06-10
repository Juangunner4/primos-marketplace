import { Helius, types } from 'helius-sdk';

export interface HeliusNFT {
  id: string;
  image: string;
  name: string;
  listed: boolean;
  attributes?: { trait_type: string; value: string }[];
}

const apiKey = process.env.REACT_APP_HELIUS_API_KEY!;
const helius = new Helius(apiKey, { network: 'mainnet' });

const collectionCache: Record<string, { ts: number; data: HeliusNFT[] }> = {};
const COLLECTION_CACHE_TTL = 60_000; // 1 minute

const nftCache: Record<string, HeliusNFT> = {};

export const getAssetsByCollection = async (
  collectionAddress: string,
  ownerAddress: string
): Promise<HeliusNFT[]> => {
  const cacheKey = `${collectionAddress}-${ownerAddress}`;
  const cached = collectionCache[cacheKey];
  if (cached && Date.now() - cached.ts < COLLECTION_CACHE_TTL) {
    return cached.data;
  }
  const nfts = await fetchCollectionNFTsForOwner(ownerAddress, collectionAddress);
  collectionCache[cacheKey] = { ts: Date.now(), data: nfts };
  return nfts;
};

export async function fetchCollectionNFTsForOwner(
  ownerAddress: string,
  collectionAddress: string
): Promise<HeliusNFT[]> {
  const limit = 100;
  let page = 1;
  const allAssetIds: string[] = [];

  while (true) {
    const { assets } = await helius.searchAssets({
      ownerAddress,
      grouping: ['collection', collectionAddress] as any,
      tokenType: 'regularNft',
      page,
      limit,
    });
    const ids = assets.items.map((a: any) => a.id as string);
    allAssetIds.push(...ids);
    if (ids.length < limit) break;
    page += 1;
  }

  const batchSize = 1000;
  const nfts: HeliusNFT[] = [];
  for (let i = 0; i < allAssetIds.length; i += batchSize) {
    const chunk = allAssetIds.slice(i, i + batchSize);
    const { result: items } = await helius.getAssetBatch({ ids: chunk });
    items.forEach((item: any) => {
      nfts.push({
        id: item.id,
        image:
          item.content?.links?.image ||
          item.content?.files?.[0]?.uri ||
          '/fallback.png',
        name: item.content?.metadata?.name || item.id,
        listed: Boolean(item.listing || item.marketplace),
        attributes: item.content?.metadata?.attributes ?? [],
      });
    });
  }
  return nfts;
}

export const getNFTByTokenAddress = async (
  tokenAddress: string
): Promise<HeliusNFT | null> => {
  if (nftCache[tokenAddress]) {
    return nftCache[tokenAddress];
  }
  try {
    const { result } = await helius.getAsset({ id: tokenAddress });
    const item = result as any;
    if (!item) return null;
    const nft: HeliusNFT = {
      id: item.id,
      image:
        item.content?.links?.image ||
        item.content?.files?.[0]?.uri ||
        '/fallback.png',
      name: item.content?.metadata?.name || item.id,
      listed: Boolean(item.listing || item.marketplace),
      attributes: item.content?.metadata?.attributes ?? [],
    };
    nftCache[tokenAddress] = nft;
    return nft;
  } catch (e) {
    console.error('Failed to fetch NFT metadata', e);
    return null;
  }
};

export const checkPrimoHolder = async (
  collectionAddress: string,
  ownerPubkey: string
): Promise<boolean> => {
  try {
    const nfts = await fetchCollectionNFTsForOwner(ownerPubkey, collectionAddress);
    return nfts.length > 0;
  } catch (e) {
    console.error('Failed to check Primo holder status', e);
    return false;
  }
};
