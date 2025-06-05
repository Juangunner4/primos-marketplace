export const getAssetsByCollection = async (collectionAddress: string, ownerPubkey: string): Promise<string[]> => {
    const apiKey = process.env.REACT_APP_HELIUS_API_KEY;
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
                page: 1,
                limit: 1000,
            },
        }),
    });

    const data = await response.json();
    console.log('Helius API raw result:', data);  
    console.log('Filtering for owner:', ownerPubkey);
    return (
        data.result?.items
            ?.filter((item: any) => item.o === ownerPubkey)
            .map((item: any) => item.id) || []
    );
};