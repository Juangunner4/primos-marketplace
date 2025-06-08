export interface HeliusNFT {
    id: string;
    image: string;
    name: string;
    listed: boolean;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

let heliusChain: Promise<unknown> = Promise.resolve();

const collectionCache: Record<string, { ts: number; data: HeliusNFT[] }> = {};
const COLLECTION_CACHE_TTL = 60_000; // 1 minute

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

export const getAssetsByCollection = async (
  collectionAddress: string,
  ownerPubkey: string
): Promise<HeliusNFT[]> => {
  const apiKey = process.env.REACT_APP_HELIUS_API_KEY;

  const cacheKey = `${collectionAddress}-${ownerPubkey}`;
  const cached = collectionCache[cacheKey];
  if (cached && Date.now() - cached.ts < COLLECTION_CACHE_TTL) {
    return cached.data;
  }

  let page = 1;
  const limit = 100;
  const allItems: any[] = [];
  let hasMore = true;

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


export const getNFTByTokenAddress = async (
  tokenAddress: string
): Promise<HeliusNFT | null> => {
  if (nftCache[tokenAddress]) {
    return nftCache[tokenAddress];
  }

  const apiKey = process.env.REACT_APP_HELIUS_API_KEY;

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
    } as HeliusNFT;
    nftCache[tokenAddress] = nft;
    return nft;
  } catch (e) {
    console.error('Failed to fetch NFT metadata', e);
    return null;
  }
};

