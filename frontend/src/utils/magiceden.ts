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