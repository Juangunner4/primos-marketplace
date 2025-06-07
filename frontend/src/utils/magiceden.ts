export interface MagicEdenStats {
    floorPrice: number | null;
    listedCount: number | null;
    listedTotalValue: number | null;
    volumeAll: number | null;
    avgPrice24hr: number | null;
    volume24hr: number | null;
    // Add more fields as needed
}

export const getMagicEdenStats = async (symbol: string): Promise<MagicEdenStats | null> => {
    try {
        const res = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            floorPrice: data.floorPrice ?? null,
            listedCount: data.listedCount ?? null,
            listedTotalValue: data.listedTotalValue ?? null,
            volumeAll: data.volumeAll ?? null,
            avgPrice24hr: data.avgPrice24hr ?? null,
            volume24hr: data.volume24hr ?? null,
        };
    } catch {
        return null;
    }
};

export interface MagicEdenHolderStats {
    symbol: string;
    totalSupply: number;
    uniqueHolders: number;
    tokenHistogram: {
        bars: { l_val: number; height: number }[];
    };
    topHolders: {
        owner: string;
        tokens: number;
        ownerDisplay?: { sol?: string };
    }[];
}


export const getMagicEdenHolderStats = async (symbol: string): Promise<MagicEdenHolderStats | null> => {
    try {
        const res = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/holder_stats`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export const fetchMagicEdenListings = async (symbol: string) => {
  const res = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/listings?offset=0&limit=100`);
  if (!res.ok) return [];
  return await res.json();
};