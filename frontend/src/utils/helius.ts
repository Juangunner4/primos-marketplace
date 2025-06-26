export interface HeliusNFT {
  id: string;
  image: string;
  name: string;
  listed: boolean;
  attributes?: { trait_type: string; value: string }[];
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

let heliusChain: Promise<unknown> = Promise.resolve();

const collectionCache: Record<string, { ts: number; data: HeliusNFT[] }> = {};
const COLLECTION_CACHE_TTL = 60_000; // 1 minute

/**
 * Internal helper that performs fetch requests with retry logic and rate limit handling.
 * @param url The target URL for the fetch call.
 * @param options Fetch options to use for the request.
 * @param retries Number of retry attempts when the request fails.
 * @param backoff Base backoff time in milliseconds between retries.
 * @param minDelay Minimum delay enforced between chained requests.
 */
const heliusFetch = async (
  url: string,
  options: RequestInit,
  retries = 3,
  backoff = 500,
  minDelay = 100
): Promise<Response> => {
  const doFetch = async (): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.status !== 429) return res;
      } catch (e) {
        if (i === retries - 1) throw e;
      }
      await sleep(backoff * (i + 1));
    }
    return fetch(url, options);
  };

  const result = heliusChain.then(doFetch);
  heliusChain = result
    .catch(() => null)
    .then(() => sleep(minDelay));
  return result;
};

/**
 * Retrieves all assets in a collection owned by a specific wallet.
 * @param collectionAddress The address of the NFT collection.
 * @param ownerPubkey The public key of the wallet to filter by.
 * @returns A list of simplified NFT objects for the owner.
 */
export const getAssetsByCollection = async (
  collectionAddress: string,
  ownerPubkey: string
): Promise<HeliusNFT[]> => {
  const apiKey = process.env.REACT_APP_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;

  if (!apiKey) {
    console.error('Helius API key is not configured. Please set REACT_APP_HELIUS_API_KEY environment variable.');
    return [];
  }

  const cacheKey = `${collectionAddress}-${ownerPubkey}`;
  const cached = collectionCache[cacheKey];
  if (cached && Date.now() - cached.ts < COLLECTION_CACHE_TTL) {
    return cached.data;
  }

  let page = 1;
  const limit = 100;
  const allItems: any[] = [];
  let hasMore = true;

  console.log('getAssetsByCollection', { collectionAddress, ownerPubkey }); // <-- Add this

  while (hasMore) {
    try {
      const response = await heliusFetch(
        `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'getAssetsByGroup',
            params: {
              groupKey: 'collection',
              groupValue: collectionAddress,
              page,
              limit,
            },
          }),
        }
      );

      if (!response.ok) break;

      const data = await response.json();
      const items = data.result?.items || [];
      allItems.push(...items);
      hasMore = items.length === limit;
      page += 1;

      if (hasMore) {
        await sleep(200);
      }
    } catch (e) {
      console.error('Failed to fetch assets by collection', e);
      break;
    }
  }

  const result = allItems
    .filter((item: any) => item.ownership?.owner === ownerPubkey)
    .map((item: any) => ({
      id: item.id,
      image:
        item.content?.links?.image ||
        item.content?.files?.[0]?.uri ||
        '/fallback.png',
      name: item.content?.metadata?.name || item.id,
      listed: !!item.listing || !!item.marketplace,
    }));
  collectionCache[cacheKey] = { ts: Date.now(), data: result };
  return result;
};

const nftCache: Record<string, HeliusNFT> = {};


/**
 * Fetches metadata for a single NFT by its token address.
 * @param tokenAddress The mint address of the NFT.
 * @returns NFT information or null when not found.
 */
export const getNFTByTokenAddress = async (
  tokenAddress: string
): Promise<HeliusNFT | null> => {
  if (nftCache[tokenAddress]) {
    return nftCache[tokenAddress];
  }

  const apiKey = process.env.REACT_APP_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;

  if (!apiKey) {
    console.error('❌ Helius API key is missing for getNFTByTokenAddress!');
    return null;
  }

  try {
    const response = await heliusFetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAsset',
          params: { id: tokenAddress },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const item = data.result;
    if (!item) return null;
    const nft = {
      id: item.id,
      image: item.content?.links?.image || '/fallback.png',
      name: item.content?.metadata?.name || item.id,
      listed: !!item.listing || !!item.marketplace,
      attributes: item.content?.metadata?.attributes || [],
    } as HeliusNFT;
    nftCache[tokenAddress] = nft;
    return nft;
  } catch (e) {
    console.error('Failed to fetch NFT metadata', e);
    return null;
  }
};

/**
 * Checks if the given wallet holds at least one NFT from the specified collection.
 * @param collectionAddress The collection's address on Solana.
 * @param ownerPubkey The wallet public key to check.
 * @returns True if the wallet owns any NFTs from the collection.
 */
export const checkPrimoHolder = async (
  collectionAddress: string,
  ownerPubkey: string
): Promise<boolean> => {
  try {
    const nfts = await getAssetsByCollection(collectionAddress, ownerPubkey);
    return nfts.length > 0;
  } catch (e) {
    console.error('Failed to check Primo holder status', e);
    return false;
  }
};

/**
 * Fetches NFTs from a collection owned by a specific address.
 * @param ownerAddress Wallet address whose NFTs will be fetched.
 * @param collectionAddress Address of the collection to search.
 * @returns Array of NFTs owned by the wallet.
 */
export async function fetchCollectionNFTsForOwner(
  ownerAddress: string,
  collectionAddress: string
): Promise<HeliusNFT[]> {
  const apiKey = process.env.REACT_APP_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;
  const limit = 100;
  let page = 1;
  let hasMore = true;
  const nfts: HeliusNFT[] = [];

  while (hasMore) {
    const response = await heliusFetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'searchAssets',
          params: {
            ownerAddress,
            grouping: ['collection', collectionAddress],
            tokenType: 'regularNft',
            page,
            limit,
          },
        }),
      }
    );

    if (!response.ok) break;

    const data = await response.json();
    const items = data.result?.items || [];
    items.forEach((item: any) => {
      nfts.push({
        id: item.id,
        image:
          item.content?.links?.image ||
          item.content?.files?.[0]?.uri ||
          '/fallback.png',
        name: item.content?.metadata?.name || item.id,
        listed: !!item.listing || !!item.marketplace,
        attributes: item.content?.metadata?.attributes ?? [],
      });
    });

    hasMore = items.length === limit;
    page += 1;
  }

  return nfts;
}
