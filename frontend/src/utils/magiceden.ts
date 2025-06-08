export interface MagicEdenStats {
    floorPrice: number | null;
    listedCount: number | null;
    listedTotalValue: number | null;
    volumeAll: number | null;
    avgPrice24hr: number | null;
    volume24hr: number | null;
    // Add more fields as needed
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
  retries = 3,
  backoff = 500
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await sleep(backoff * (i + 1));
  }
  return fetch(url, options);
};

const cache: Record<string, { ts: number; data: any }> = {};
const CACHE_TTL = 60_000; // 1 minute

const getCached = <T>(key: string): T | null => {
  const c = cache[key];
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data as T;
  return null;
};

const setCached = (key: string, data: any) => {
  cache[key] = { ts: Date.now(), data };
};

export const getMagicEdenStats = async (
  symbol: string
): Promise<MagicEdenStats | null> => {
  const key = `stats-${symbol}`;
  const cached = getCached<MagicEdenStats>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const parsed: MagicEdenStats = {
      floorPrice: data.floorPrice ?? null,
      listedCount: data.listedCount ?? null,
      listedTotalValue: data.listedTotalValue ?? null,
      volumeAll: data.volumeAll ?? null,
      avgPrice24hr: data.avgPrice24hr ?? null,
      volume24hr: data.volume24hr ?? null,
    };
    setCached(key, parsed);
    return parsed;
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


export const getMagicEdenHolderStats = async (
  symbol: string
): Promise<MagicEdenHolderStats | null> => {
  const key = `holder-${symbol}`;
  const cached = getCached<MagicEdenHolderStats>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/holder_stats`
    );
    if (!res.ok) return null;
    const data = await res.json();
    setCached(key, data);
    return data;
  } catch {
    return null;
  }
};

export const fetchMagicEdenListings = async (
  symbol: string,
  offset = 0,
  limit = 10
) => {
  const key = `list-${symbol}-${offset}-${limit}`;
  const cached = getCached<any[]>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/listings?offset=${offset}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const sorted = (data || []).sort(
      (a: any, b: any) => (a.price ?? 0) - (b.price ?? 0)
    );
    setCached(key, sorted);
    return sorted;
  } catch (e) {
    console.error('Failed to fetch Magic Eden listings', e);
    return [];
  }
};

export const fetchMagicEdenActivity = async (
  symbol: string,
  offset = 0,
  limit = 10
) => {
  const key = `activity-${symbol}-${offset}-${limit}`;
  const cached = getCached<any[]>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=${offset}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    setCached(key, data);
    return data;
  } catch (e) {
    console.error('Failed to fetch Magic Eden activity', e);
    return [];
  }
};
