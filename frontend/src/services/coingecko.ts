export interface CoinGeckoTokenPrice {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  usd_24h_change?: number;
  last_updated_at?: number;
}

export interface CoinGeckoTokenInfo {
  id: string;
  symbol: string;
  name: string;
  asset_platform_id: string;
  platforms: Record<string, string>;
  detail_platforms: Record<string, {
    decimal_place: number;
    contract_address: string;
  }>;
  block_time_in_minutes: number;
  hashing_algorithm: string;
  categories: string[];
  public_notice?: string;
  additional_notices: string[];
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    bitcointalk_thread_identifier: number;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string;
  genesis_date: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  coingecko_rank: number;
  coingecko_score: number;
  developer_score: number;
  community_score: number;
  liquidity_score: number;
  public_interest_score: number;
  market_data: {
    current_price: Record<string, number>;
    total_value_locked?: Record<string, number>;
    mcap_to_tvl_ratio?: number;
    fdv_to_tvl_ratio?: number;
    roi?: {
      times: number;
      currency: string;
      percentage: number;
    };
    ath: Record<string, number>;
    ath_change_percentage: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_change_percentage: Record<string, number>;
    atl_date: Record<string, string>;
    market_cap: Record<string, number>;
    market_cap_rank: number;
    fully_diluted_valuation: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_14d: number;
    price_change_percentage_30d: number;
    price_change_percentage_60d: number;
    price_change_percentage_200d: number;
    price_change_percentage_1y: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    price_change_24h_in_currency: Record<string, number>;
    price_change_percentage_1h_in_currency: Record<string, number>;
    price_change_percentage_24h_in_currency: Record<string, number>;
    price_change_percentage_7d_in_currency: Record<string, number>;
    price_change_percentage_14d_in_currency: Record<string, number>;
    price_change_percentage_30d_in_currency: Record<string, number>;
    price_change_percentage_60d_in_currency: Record<string, number>;
    price_change_percentage_200d_in_currency: Record<string, number>;
    price_change_percentage_1y_in_currency: Record<string, number>;
    market_cap_change_24h_in_currency: Record<string, number>;
    market_cap_change_percentage_24h_in_currency: Record<string, number>;
    total_supply: number;
    max_supply: number;
    circulating_supply: number;
    last_updated: string;
  };
  public_interest_stats: {
    alexa_rank: number;
    bing_matches: number;
  };
  status_updates: any[];
  last_updated: string;
}

export interface CoinGeckoPoolData {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    token_price_usd: string;
    fdv_usd: string;
    market_cap_usd: string;
    price_change_percentage: {
      h1: string;
      h24: string;
    };
    transactions: {
      h1: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
      h24: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
    };
    volume_usd: {
      h1: string;
      h24: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        type: string;
      };
    };
    quote_token: {
      data: {
        id: string;
        type: string;
      };
    };
    dex: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

export interface LiquidityPool {
  id: string;
  name: string;
  address: string;
  dex: string;
  baseToken: string;
  quoteToken: string;
  reserve: string;
  volume24h: string;
  priceChange24h: string;
  transactions24h: number;
  createdAt: string;
}

export interface CoinGeckoNFTCollection {
  id: string;
  contract_address: string;
  asset_platform_id: string;
  name: string;
  symbol?: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  description: string;
  native_currency: string;
  native_currency_symbol: string;
  floor_price: {
    native_currency: number;
    usd: number;
  };
  market_cap: {
    native_currency: number;
    usd: number;
  };
  volume_24h: {
    native_currency: number;
    usd: number;
  };
  floor_price_in_usd_24h_percentage_change: number;
  market_cap_in_usd_24h_percentage_change: number;
  volume_in_usd_24h_percentage_change: number;
  number_of_unique_addresses: number;
  number_of_unique_addresses_24h_percentage_change: number;
  total_supply: number;
  links: {
    homepage: string;
    twitter: string;
    discord: string;
  };
  floor_price_7d_percentage_change: number;
  floor_price_14d_percentage_change: number;
  floor_price_30d_percentage_change: number;
  floor_price_60d_percentage_change: number;
  floor_price_1y_percentage_change: number;
  explorers: Array<{
    name: string;
    link: string;
  }>;
}

export interface CoinGeckoNFTData {
  collection: CoinGeckoNFTCollection;
  fallback_image?: string;
  formatted_entries?: CoinGeckoEntry[];
}

export interface TrendingPoolsResponse {
  data: CoinGeckoPoolData[];
  included?: Array<{
    id: string;
    type: string;
    attributes: {
      name?: string;
      symbol?: string;
      address?: string;
    };
  }>;
}

export interface CoinGeckoEntry {
  id: string;
  label: string;
  value: string;
  change?: string;
}

// Cache for API responses
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute

const getCached = <T>(key: string): T | null => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCached = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Helper function to format USD amounts
const formatUsdAmount = (amount: number): string => {
  if (amount > 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount > 1000) {
    return `$${(amount / 1000).toFixed(2)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
};

// Ensure requests are queued to avoid hitting CoinGecko's strict rate limits
let fetchQueue: Promise<any> = Promise.resolve();

const rateLimitedFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  fetchQueue = fetchQueue.then(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();
    return fetch(url, options);
  });
  return fetchQueue;
};

/**
 * Fetch simple token price using CoinGecko API via backend proxy
 * @param contractAddress - Token contract address
 * @param network - Network identifier (ethereum, solana, etc.)
 * @returns Token price data or null
 */
export const fetchSimpleTokenPrice = async (
  contractAddress: string,
  network: string = 'solana',
  retries = 1
): Promise<CoinGeckoTokenPrice | null> => {
  const cacheKey = `simple-price-${network}-${contractAddress}`;
  const cached = getCached<CoinGeckoTokenPrice>(cacheKey);
  if (cached) return cached;

  try {
    // Use backend proxy to avoid CORS issues
    const apiKey = process.env.REACT_APP_COINGECKO_API_KEY;
    const url =
      `/api/coingecko/simple/token_price/${network}?contract_addresses=${contractAddress}` +
      `&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true` +
      (apiKey ? `&x_cg_demo_api_key=${apiKey}` : '');

    const response = await rateLimitedFetch(url);

    if (response.status === 429 && retries > 0) {
      // Respect rate limit by waiting briefly before retrying
      const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return fetchSimpleTokenPrice(contractAddress, network, retries - 1);
    }

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    // CoinGecko returns token data keyed exactly as the contract address is
    // provided in the request for some networks (e.g. Solana). For these
    // networks, lowercasing the address will result in a cache miss.
    // Attempt to read the data using both the lowercased address (for
    // case-insensitive chains like Ethereum) and the original address to
    // support mixed-case identifiers.
    const tokenData =
      data[contractAddress.toLowerCase()] || data[contractAddress];
    
    if (!tokenData) {
      return null;
    }
    
    setCached(cacheKey, tokenData);
    return tokenData;
  } catch (error) {
    console.error('Error in fetchNFTWithCoinGeckoBackup:', error);
    return null;
  }
};

/**
 * Fetch comprehensive token data and format it for display
 * @param contractAddress - Token contract address
 * @param network - Network identifier
 * @returns Formatted token entries for display
 */
export const fetchCoinGeckoData = async (
  contractAddress: string,
  network: string = 'solana'
): Promise<CoinGeckoEntry[]> => {
  try {
    // Only use simple price API to avoid CORS and Pro API issues
    const priceData = await fetchSimpleTokenPrice(contractAddress, network);

    const entries: CoinGeckoEntry[] = [];

    // Price information from simple API
    if (priceData) {
      if (priceData.usd) {
        entries.push({
          id: 'price',
          label: 'price',
          value: `$${priceData.usd.toFixed(8)}`,
          change: priceData.usd_24h_change ? `${priceData.usd_24h_change.toFixed(2)}%` : undefined,
        });
      }

      if (priceData.usd_market_cap) {
        entries.push({
          id: 'market_cap',
          label: 'market_cap',
          value: `$${(priceData.usd_market_cap / 1000000).toFixed(2)}M`,
        });
      }

      if (priceData.usd_24h_vol) {
        entries.push({
          id: 'volume_24h',
          label: 'volume_24h',
          value: `$${(priceData.usd_24h_vol / 1000000).toFixed(2)}M`,
        });
      }

      if (priceData.last_updated_at) {
        entries.push({
          id: 'last_updated',
          label: 'last_updated',
          value: new Date(priceData.last_updated_at * 1000).toLocaleString(),
        });
      }
    }

    if (entries.length === 0) {
      // No data available
    }

    return entries;
  } catch (error) {
    console.error('Error in fetchTokenPools:', error);
    return [];
  }
};

/**
 * Get current market cap for a token at a specific time (for historical tracking)
 * @param contractAddress - Token contract address
 * @param network - Network identifier
 * @returns Current market cap or null
 */
export const getCurrentMarketCap = async (
  contractAddress: string,
  network: string = 'solana'
): Promise<number | null> => {
  try {
    const priceData = await fetchSimpleTokenPrice(contractAddress, network);
    return priceData?.usd_market_cap || null;
  } catch (error) {
    console.error('Error in getCurrentMarketCap:', error);
    return null;
  }
};

/**
 * Fetch trending liquidity pools from CoinGecko
 * Note: This is a simplified implementation that shows a coming soon message
 * @param limit - Number of pools to fetch (default: 10)
 * @returns Array of trending liquidity pools
 */
export const fetchTrendingPools = async (
  limit: number = 10
): Promise<LiquidityPool[]> => {
  const cacheKey = `trending-pools-${limit}`;
  const cached = getCached<LiquidityPool[]>(cacheKey);
  if (cached) return cached;

  try {
    // For now, return empty array since CoinGecko liquidity pools API 
    // requires additional backend proxy setup
    
    const pools: LiquidityPool[] = [];
    setCached(cacheKey, pools);
    return pools;
  } catch (error) {
    console.error('Error in fetchTokenPools:', error);
    return [];
  }
};

/**
 * Fetch liquidity pools for a specific token
 * @param tokenAddress - Token contract address
 * @param network - Network identifier (default: solana)
 * @param limit - Number of pools to fetch (default: 5)
 * @returns Array of liquidity pools for the token
 */
export const fetchTokenPools = async (
  tokenAddress: string,
  network: string = 'solana',
  limit: number = 5
): Promise<LiquidityPool[]> => {
  const cacheKey = `token-pools-${network}-${tokenAddress}-${limit}`;
  const cached = getCached<LiquidityPool[]>(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.REACT_APP_COINGECKO_API_KEY;
    const url = `/api/coingecko/pools/${tokenAddress}?network=${network}&limit=${limit}` +
      (apiKey ? `&api_key=${apiKey}` : '');

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.error(`CoinGecko token pools API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    // Handle the placeholder response
    if (data.pools && Array.isArray(data.pools)) {
      const pools: LiquidityPool[] = data.pools;
      setCached(cacheKey, pools);
      return pools;
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchTokenPools:', error);
    return [];
  }
};

/**
 * Create formatted entries for CoinGecko NFT collection data
 * @param collection - CoinGecko NFT collection data
 * @returns Array of formatted entries for display
 */
const createNFTCollectionEntries = (collection: CoinGeckoNFTCollection): CoinGeckoEntry[] => {
  const entries: CoinGeckoEntry[] = [];
  
  if (collection.floor_price?.usd) {
    entries.push({
      id: 'floor_price',
      label: 'floor_price',
      value: formatUsdAmount(collection.floor_price.usd),
      change: collection.floor_price_in_usd_24h_percentage_change 
        ? `${collection.floor_price_in_usd_24h_percentage_change.toFixed(2)}%` 
        : undefined,
    });
  }

  if (collection.market_cap?.usd) {
    entries.push({
      id: 'market_cap',
      label: 'market_cap',
      value: formatUsdAmount(collection.market_cap.usd),
      change: collection.market_cap_in_usd_24h_percentage_change 
        ? `${collection.market_cap_in_usd_24h_percentage_change.toFixed(2)}%` 
        : undefined,
    });
  }

  if (collection.volume_24h?.usd) {
    entries.push({
      id: 'volume_24h',
      label: 'volume_24h',
      value: formatUsdAmount(collection.volume_24h.usd),
      change: collection.volume_in_usd_24h_percentage_change 
        ? `${collection.volume_in_usd_24h_percentage_change.toFixed(2)}%` 
        : undefined,
    });
  }

  if (collection.total_supply) {
    entries.push({
      id: 'total_supply',
      label: 'total_supply',
      value: collection.total_supply.toLocaleString(),
    });
  }

  if (collection.number_of_unique_addresses) {
    entries.push({
      id: 'unique_holders',
      label: 'unique_holders',
      value: collection.number_of_unique_addresses.toLocaleString(),
      change: collection.number_of_unique_addresses_24h_percentage_change 
        ? `${collection.number_of_unique_addresses_24h_percentage_change.toFixed(2)}%` 
        : undefined,
    });
  }

  return entries;
};

// Helper function to process NFT collection data
const processNFTCollectionData = (data: any, contractAddress: string): CoinGeckoNFTData => {
  const collection: CoinGeckoNFTCollection = data;
  const entries = createNFTCollectionEntries(collection);

  return {
    collection,
    fallback_image: collection.image?.large || collection.image?.small || collection.image?.thumb,
    formatted_entries: entries,
  };
};

// Helper function to try alternative NFT endpoint
const tryAlternativeNFTEndpoint = async (contractAddress: string, assetPlatformId: string, apiKey?: string): Promise<any> => {
  const altUrl = `/api/coingecko/nfts/contract/${contractAddress}?asset_platform_id=${assetPlatformId}` +
    (apiKey ? `&x_cg_demo_api_key=${apiKey}` : '');
  
  const altResponse = await rateLimitedFetch(altUrl);
  
  if (!altResponse.ok) {
    return null;
  }
  
  const altData = await altResponse.json();
  
  return altData?.id ? altData : null;
};

/**
 * Fetch NFT collection data by contract address using CoinGecko API
 * Uses the proper /nfts/{asset_platform_id}/contract/{contract_address} endpoint
 * @param contractAddress - NFT collection contract address
 * @param network - Network identifier (solana, ethereum, etc.)
 * @returns NFT collection data or null
 */
export const fetchNFTCollectionData = async (
  contractAddress: string,
  network: string = 'solana'
): Promise<CoinGeckoNFTData | null> => {
  const cacheKey = `nft-collection-${network}-${contractAddress}`;
  const cached = getCached<CoinGeckoNFTData>(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.REACT_APP_COINGECKO_API_KEY;
    
    // Map network names to CoinGecko asset platform IDs
    const platformMap: Record<string, string> = {
      'solana': 'solana',
      'ethereum': 'ethereum',
      'polygon': 'polygon-pos',
      'binance-smart-chain': 'binance-smart-chain',
      'avalanche': 'avalanche',
    };
    
    const assetPlatformId = platformMap[network] || network;
    
    // Use the correct CoinGecko NFT contract endpoint
    const url = `/api/coingecko/nfts/${assetPlatformId}/contract/${contractAddress}` +
      (apiKey ? `?x_cg_demo_api_key=${apiKey}` : '');

    const response = await rateLimitedFetch(url);

    let data = null;

    if (!response.ok) {
      
      // Try alternative endpoint format if the first one fails with 404
      if (response.status === 404) {
        data = await tryAlternativeNFTEndpoint(contractAddress, assetPlatformId, apiKey);
      }
      
      if (!data) return null;
    } else {
      data = await response.json();
    }
    
    if (!data?.id) {
      return null;
    }

    const nftData = processNFTCollectionData(data, contractAddress);
    setCached(cacheKey, nftData);
    return nftData;
  } catch (error) {
    console.error('Error in fetchNFTWithCoinGeckoBackup:', error);
    return null;
  }
};

/**
 * Search for NFT collections by name using CoinGecko API
 * Useful when you don't have the contract address but know the collection name
 * @param query - Search query (collection name)
 * @param assetPlatformId - Platform ID (default: solana)
 * @returns Array of matching NFT collections
 */
export const searchNFTCollections = async (
  query: string,
  assetPlatformId: string = 'solana'
): Promise<any[]> => {
  const cacheKey = `nft-search-${assetPlatformId}-${query}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.REACT_APP_COINGECKO_API_KEY;
    const url = `/api/coingecko/search/nfts?query=${encodeURIComponent(query)}` +
      (apiKey ? `&x_cg_demo_api_key=${apiKey}` : '');

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.error(`CoinGecko NFT search API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const nfts = data?.nfts || [];
    
    // Filter by platform if specified
    const filteredNfts = assetPlatformId 
      ? nfts.filter((nft: any) => nft.asset_platform_id === assetPlatformId)
      : nfts;

    setCached(cacheKey, filteredNfts);
    return filteredNfts;
  } catch (error) {
    console.error('Error in searchNFTCollections:', error);
    return [];
  }
};

/**
 * Get NFT collection data by CoinGecko ID
 * @param nftId - CoinGecko NFT collection ID
 * @returns NFT collection data or null
 */
export const fetchNFTCollectionById = async (
  nftId: string
): Promise<CoinGeckoNFTData | null> => {
  const cacheKey = `nft-by-id-${nftId}`;
  const cached = getCached<CoinGeckoNFTData>(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.REACT_APP_COINGECKO_API_KEY;
    const url = `/api/coingecko/nfts/${nftId}` +
      (apiKey ? `?x_cg_demo_api_key=${apiKey}` : '');

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data?.id) {
      return null;
    }

    const nftData = processNFTCollectionData(data, data.contract_address || nftId);
    setCached(cacheKey, nftData);
    return nftData;
  } catch (error) {
    console.error('Error in fetchNFTWithCoinGeckoBackup:', error);
    return null;
  }
};

/**
 * Get NFT metadata with CoinGecko as backup for Helius
 * Combines Helius data with CoinGecko collection data when available
 * @param tokenAddress - NFT token address
 * @param collectionAddress - NFT collection address (optional)
 * @param network - Network identifier (default: solana)
 * @returns Enhanced NFT metadata or null
 */
export const fetchNFTWithCoinGeckoBackup = async (
  tokenAddress: string,
  collectionAddress?: string,
  network: string = 'solana'
): Promise<{
  id: string;
  image: string | undefined;
  name: string;
  listed: boolean;
  attributes?: { trait_type: string; value: string }[];
  symbol?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  coinGeckoData?: CoinGeckoNFTData;
} | null> => {
  try {
    // First try to get data from Helius (imported dynamically to avoid circular deps)
    let heliusData = null;
    try {
      const { getNFTByTokenAddress } = await import('../utils/helius');
      heliusData = await getNFTByTokenAddress(tokenAddress);
    } catch (error) {
      // Helius fetch failed, fallback to CoinGecko
      console.error('Failed to fetch NFT data from Helius:', error);
    }

    // Get CoinGecko collection data as backup/enhancement
    let coinGeckoData = null;
    if (collectionAddress) {
      coinGeckoData = await fetchNFTCollectionData(collectionAddress, network);
    }

    // If we have Helius data, enhance it with CoinGecko data
    if (heliusData) {
      return {
        ...heliusData,
        coinGeckoData: coinGeckoData || undefined,
      };
    }

    // If no Helius data but we have CoinGecko collection data, create fallback NFT
    if (coinGeckoData) {
      return {
        id: tokenAddress,
        image: coinGeckoData.fallback_image || undefined,
        name: coinGeckoData.collection.name || 'Unknown NFT',
        listed: false,
        symbol: coinGeckoData.collection.symbol,
        description: coinGeckoData.collection.description,
        attributes: [],
        metadata: {
          collection: coinGeckoData.collection.name,
          platform: network,
        },
        coinGeckoData,
      };
    }

    return null;
  } catch (error) {
    console.error('Error in fetchNFTWithCoinGeckoBackup:', error);
    return null;
  }
};
