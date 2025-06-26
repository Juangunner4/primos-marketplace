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

// Default to the backend proxy when running outside localhost to avoid CORS
const defaultApiBase =
  typeof window !== 'undefined' && !window.location.hostname.match(/^localhost/)
    ? '/api/proxy'
    : 'https://api-mainnet.magiceden.dev';

const API_BASE = process.env.REACT_APP_MAGICEDEN_BASE ?? defaultApiBase;

// Debug logging
console.log('MagicEden API Configuration:', {
  REACT_APP_MAGICEDEN_BASE: process.env.REACT_APP_MAGICEDEN_BASE,
  API_BASE,
  NODE_ENV: process.env.NODE_ENV
});

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
const ATTR_CACHE_TTL = 300_000; // 5 minutes

const attrCache: Record<string, { ts: number; data: any }> = {};

const getCached = <T>(key: string): T | null => {
  const c = cache[key];
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data as T;
  return null;
};

const setCached = (key: string, data: any) => {
  cache[key] = { ts: Date.now(), data };
};

const getAttrCached = <T>(key: string): T | null => {
  const c = attrCache[key];
  if (c && Date.now() - c.ts < ATTR_CACHE_TTL) return c.data as T;
  return null;
};

const setAttrCached = (key: string, data: any) => {
  attrCache[key] = { ts: Date.now(), data };
};

/**
 * Retrieves general collection statistics from Magic Eden.
 * @param symbol The collection symbol used by Magic Eden.
 * @returns Parsed statistics or null on failure.
 */
export const getMagicEdenStats = async (
  symbol: string
): Promise<MagicEdenStats | null> => {
  const key = `stats-${symbol}`;
  const cached = getCached<MagicEdenStats>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/v2/collections/${symbol}/stats`
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


/**
 * Retrieves holder statistics for a collection.
 * @param symbol The collection symbol used by Magic Eden.
 * @returns Holder stats information or null on failure.
 */
export const getMagicEdenHolderStats = async (
  symbol: string
): Promise<MagicEdenHolderStats | null> => {
  const key = `holder-${symbol}`;
  const cached = getCached<MagicEdenHolderStats>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/v2/collections/${symbol}/holder_stats`
    );
    if (!res.ok) return null;
    const data = await res.json();
    setCached(key, data);
    return data;
  } catch {
    return null;
  }
};

/**
 * Fetches marketplace listings for a collection and sorts them by price.
 * @param symbol The collection symbol used by Magic Eden.
 * @param offset Pagination offset.
 * @param limit Maximum number of listings to return.
 * @returns Sorted list of listings or an empty array on failure.
 */
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
      `${API_BASE}/v2/collections/${symbol}/listings?offset=${offset}&limit=${limit}`
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

/**
 * Fetches recent activity for a collection.
 * @param symbol The collection symbol used by Magic Eden.
 * @param offset Pagination offset.
 * @param limit Maximum number of records to return.
 * @returns Activity array or an empty array when an error occurs.
 */
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
      `/api/magiceden/activities?offset=${offset}&limit=${limit}`
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

/**
 * Retrieves attribute data for a collection.
 * @param symbol The collection symbol used by Magic Eden.
 * @returns Attribute information or null if not found.
 */
export const getCollectionAttributes = async (
  symbol: string
): Promise<any | null> => {
  const key = `attrs-${symbol}`;
  const cached = getAttrCached<any>(key);
  if (cached) return cached;
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/v2/collections/${symbol}/attributes`
    );
    if (!res.ok) return null;
    const data = await res.json();
    setAttrCached(key, data);
    return data;
  } catch {
    return null;
  }
};

/**
 * Fetches the floor price for a specific trait from Magic Eden.
 * @param collectionSymbol The collection symbol (e.g., "primos")
 * @param traitType The trait type (e.g., "Clothing")
 * @param traitValue The trait value (e.g., "Event Staff")
 * @returns The floor price in SOL, or null if not found.
 */
export const getTraitFloorPrice = async (
  collectionSymbol: string,
  traitType: string,
  traitValue: string
): Promise<number | null> => {
  const key = `trait-floor-${collectionSymbol}-${traitType}-${traitValue}`;
  const cached = getCached<number | null>(key);
  if (cached !== null) return cached;
  try {
    const data = await getCollectionAttributes(collectionSymbol);
    if (!data) {
      setCached(key, null);
      return null;
    }
    // Find the trait type and value
    const traitArr = data?.attributes?.[traitType] || [];
    const traitObj = traitArr.find((t: any) => t.value === traitValue);
    const floorValue = traitObj?.floorPrice ?? traitObj?.floor;
    const floor = floorValue != null ? Number(floorValue) : null;
    setCached(key, floor);
    return floor;
  } catch {
    setCached(key, null);
    return null;
  }
};
