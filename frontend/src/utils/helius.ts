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
    let allItems: any[] = [];
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method: "getAssetsByGroup",
                params: {
                    groupKey: "collection",
                    groupValue: collectionAddress,
                    page,
                    limit,
                },
            }),
        });

        const data = await response.json();
        const items = data.result?.items || [];
        allItems = allItems.concat(items);
        hasMore = items.length === limit;
        page++;

        if (hasMore) {
            // Remove or reduce delay for faster loading
            // await new Promise(res => setTimeout(res, 300));
            await new Promise(res => setTimeout(res, 10));
        }
    }

    console.log('First NFT raw item:', allItems[0]);

    // Map to HeliusNFT structure
    return allItems
        .filter((item: any) => item.ownership?.owner === ownerPubkey)
        .map((item: any) => ({
            id: item.id,
            image: item.content?.links?.image || item.content?.files?.[0]?.uri || '/fallback.png',
            name: item.content?.metadata?.name || item.id,
            listed: !!item.listing || !!item.marketplace, 
        }));
};


export const getNFTByTokenAddress = async (tokenAddress: string): Promise<HeliusNFT | null> => {
    const apiKey = process.env.REACT_APP_HELIUS_API_KEY;
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getAsset",
            params: {
                id: tokenAddress,
            },
        }),
    });

    const data = await response.json();
    const item = data.result;
    if (!item) return null;
    return {
        id: item.id,
        image: item.content?.links?.image || '/fallback.png',
        name: item.content?.metadata?.name || item.id,
        listed: !!item.listing || !!item.marketplace,
    };
};