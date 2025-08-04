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
      console.error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
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
      console.warn(`No price data found for contract ${contractAddress} on ${network}`);
      return null;
    }
    
    setCached(cacheKey, tokenData);
    return tokenData;
  } catch (error) {
    console.error('Error fetching simple token price:', error);
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
      console.warn(`No data available for contract ${contractAddress}`);
    }

    return entries;
  } catch (error) {
    console.error('Error fetching CoinGecko data:', error);
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
    console.error('Error fetching current market cap:', error);
    return null;
  }
};
