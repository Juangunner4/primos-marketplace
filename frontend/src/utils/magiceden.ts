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

// Always use the backend proxy for all Magic Eden requests
const API_BASE = '/api/proxy';


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
 * @returns List of listings or an empty array on failure.
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
    // Ensure listings are consistently ordered by price so pagination
    // yields deterministic results and displays NFTs by floor price.
    data.sort((a: any, b: any) => {
      const pa = typeof a.price === 'number' ? a.price : Number.POSITIVE_INFINITY;
      const pb = typeof b.price === 'number' ? b.price : Number.POSITIVE_INFINITY;
      return pa - pb;
    });
    setCached(key, data);
    return data;
  } catch (e) {
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
      `${API_BASE}/v2/collections/${symbol}/activities?offset=${offset}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    setCached(key, data);
    return data;
  } catch (e) {
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

/**
 * Requests Magic Eden's "buy now" instructions via the backend.
 * @param params Query parameters for the instruction builder
 * @returns JSON response from Magic Eden
 */
export const getBuyNowInstructions = async (
  params: Record<string, string>
): Promise<any> => {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/magiceden/instructions/buy-now?${qs}`);
  if (!res.ok) {
    throw new Error('Failed to fetch buy now instructions');
  }
  return res.json();
};

/**
 * Requests Magic Eden's listing instructions via the backend.
 * @param params Query parameters for the instruction builder
 * @returns JSON response from Magic Eden
 */
export const getListInstructions = async (
  params: Record<string, string>
): Promise<any> => {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/magiceden/list?${qs}`);
  if (!res.ok) {
    throw new Error('Failed to fetch list instructions');
  }
  return res.json();
};
