export interface HeliusNFT {
    id: string;
    image: string;
    name: string;
    listed: boolean;
}

export const getAssetsByCollection = async (
  collectionAddress: string,
  ownerPubkey: string
): Promise<HeliusNFT[]> => {
  const apiKey = process.env.REACT_APP_HELIUS_API_KEY;

  let page = 1;
  const limit = 100;
  const allItems: any[] = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(
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
        await new Promise((res) => setTimeout(res, 10));
      }
    } catch (e) {
      console.error('Failed to fetch assets by collection', e);
      break;
    }
  }

  return allItems
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
    const response = await fetch(
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

