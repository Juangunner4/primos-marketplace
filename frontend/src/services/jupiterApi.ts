/**
 * Jupiter API integration for token swaps
 * Using the free tier: https://dev.jup.ag/docs/
 */

// Jupiter API base URL
const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/strict';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  coingeckoId?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

/**
 * Get comprehensive token information from Jupiter and CoinGecko
 */
export const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo | null> => {
  try {
    // First, get token info from Jupiter
    const jupiterTokens = await getJupiterTokenList();
    const jupiterToken = jupiterTokens.find((token: any) => token.address === tokenAddress);
    
    if (!jupiterToken) {
      return null;
    }

    const tokenInfo: TokenInfo = {
      address: jupiterToken.address,
      symbol: jupiterToken.symbol,
      name: jupiterToken.name,
      decimals: jupiterToken.decimals,
      logoURI: jupiterToken.logoURI,
      tags: jupiterToken.tags || [],
    };

    // Try to get price data from CoinGecko if we have a coingecko ID
    if (jupiterToken.extensions?.coingeckoId) {
      try {
        const priceData = await getCoinGeckoTokenData(jupiterToken.extensions.coingeckoId);
        if (priceData) {
          tokenInfo.coingeckoId = jupiterToken.extensions.coingeckoId;
          tokenInfo.price = priceData.current_price;
          tokenInfo.marketCap = priceData.market_cap;
          tokenInfo.volume24h = priceData.total_volume;
          tokenInfo.priceChange24h = priceData.price_change_percentage_24h;
        }
      } catch (error) {
        console.warn('Failed to fetch CoinGecko data for', tokenInfo.symbol, error);
      }
    }

    return tokenInfo;
  } catch (error) {
    console.error('Failed to get token info for', tokenAddress, error);
    return null;
  }
};

/**
 * Get Jupiter token list
 */
export const getJupiterTokenList = async (): Promise<any[]> => {
  const response = await fetch(JUPITER_TOKEN_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Jupiter token list: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Get token data from CoinGecko
 */
export const getCoinGeckoTokenData = async (coingeckoId: string): Promise<any | null> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data[coingeckoId] || null;
  } catch (error) {
    console.warn('Failed to fetch CoinGecko data:', error);
    return null;
  }
};

/**
 * Get token balance and metadata from Helius
 */
export const getTokenBalance = async (walletAddress: string, tokenMint: string): Promise<number> => {
  try {
    const apiKey = process.env.REACT_APP_HELIUS_API_KEY;
    if (!apiKey) {
      console.warn('REACT_APP_HELIUS_API_KEY not configured, using demo mode');
      return 0;
    }

    const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token balance');
    }

    const data = await response.json();
    
    // Check for SOL balance
    if (tokenMint === SOLANA_TOKEN_ADDRESSES.SOL) {
      return data.nativeBalance ? data.nativeBalance / 1e9 : 0;
    }

    // Check for SPL token balance
    const token = data.tokens?.find((t: any) => t.mint === tokenMint);
    return token ? token.amount : 0;
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return 0;
  }
};

/**
 * Get popular tradeable tokens from Jupiter
 */
export const getPopularTradeableTokens = async (): Promise<TokenInfo[]> => {
  try {
    const jupiterTokens = await getJupiterTokenList();
    
    // Filter for popular tokens with high trading volume
    const popularTokenMints = [
      SOLANA_TOKEN_ADDRESSES.SOL,
      SOLANA_TOKEN_ADDRESSES.USDC,
      SOLANA_TOKEN_ADDRESSES.USDT,
      SOLANA_TOKEN_ADDRESSES.JUP,
      SOLANA_TOKEN_ADDRESSES.MSOL,
      SOLANA_TOKEN_ADDRESSES.BSOL,
      SOLANA_TOKEN_ADDRESSES.PYTH,
      SOLANA_TOKEN_ADDRESSES.BONK,
      SOLANA_TOKEN_ADDRESSES.WEN,
      SOLANA_TOKEN_ADDRESSES.JITO,
      SOLANA_TOKEN_ADDRESSES.JITOSOL,
      SOLANA_TOKEN_ADDRESSES.HNT,
      SOLANA_TOKEN_ADDRESSES.RAY,
      SOLANA_TOKEN_ADDRESSES.SRM,
      SOLANA_TOKEN_ADDRESSES.FTT,
      SOLANA_TOKEN_ADDRESSES.COPE,
      SOLANA_TOKEN_ADDRESSES.STEP,
      SOLANA_TOKEN_ADDRESSES.MEDIA,
      SOLANA_TOKEN_ADDRESSES.ROPE,
      SOLANA_TOKEN_ADDRESSES.TULIP,
      SOLANA_TOKEN_ADDRESSES.SAMO,
      SOLANA_TOKEN_ADDRESSES.FIDA,
      SOLANA_TOKEN_ADDRESSES.KIN,
      SOLANA_TOKEN_ADDRESSES.MAPS,
      SOLANA_TOKEN_ADDRESSES.ORCA,
      SOLANA_TOKEN_ADDRESSES.MER,
      SOLANA_TOKEN_ADDRESSES.PORT,
      SOLANA_TOKEN_ADDRESSES.SBR,
      SOLANA_TOKEN_ADDRESSES.SUNNY,
      SOLANA_TOKEN_ADDRESSES.DUST,
      SOLANA_TOKEN_ADDRESSES.STAR,
      SOLANA_TOKEN_ADDRESSES.POLIS,
      SOLANA_TOKEN_ADDRESSES.GENE,
      SOLANA_TOKEN_ADDRESSES.MNGO,
      SOLANA_TOKEN_ADDRESSES.SNY,
      SOLANA_TOKEN_ADDRESSES.DFL,
      // Additional meme/popular tokens
      'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', // DUST
      'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6', // TNSR
      'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', // RND
      'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM', // UXD
      'CKaKtYvz6dKPyMvYq9Rh3UBrnNqYZAyd7iF4hJtjUvks', // GOFX
      'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB', // GST
      '5yxNbU8DgYJZNi5QQn9LbAXzK7Y8HoULBEegUZXzGByi', // RIN
      'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB', // GMX
    ];

    const popularTokens: TokenInfo[] = [];

    for (const tokenMint of popularTokenMints) {
      const jupiterToken = jupiterTokens.find((token: any) => token.address === tokenMint);
      
      if (jupiterToken) {
        const tokenInfo: TokenInfo = {
          address: jupiterToken.address,
          symbol: jupiterToken.symbol,
          name: jupiterToken.name,
          decimals: jupiterToken.decimals,
          logoURI: jupiterToken.logoURI,
          tags: jupiterToken.tags || [],
        };

        // Try to get price data from CoinGecko if available
        if (jupiterToken.extensions?.coingeckoId) {
          try {
            const priceData = await getCoinGeckoTokenData(jupiterToken.extensions.coingeckoId);
            if (priceData) {
              tokenInfo.coingeckoId = jupiterToken.extensions.coingeckoId;
              tokenInfo.price = priceData.current_price;
              tokenInfo.marketCap = priceData.market_cap;
              tokenInfo.volume24h = priceData.total_volume;
              tokenInfo.priceChange24h = priceData.price_change_percentage_24h;
            }
          } catch (error) {
            console.warn('Failed to fetch CoinGecko data for', tokenInfo.symbol);
          }
        }

        popularTokens.push(tokenInfo);
      }
    }

    return popularTokens;
  } catch (error) {
    console.error('Failed to get popular tradeable tokens:', error);
    return [];
  }
};

export interface WalletTokenInfo extends TokenInfo {
  balance: number;
}

/**
 * Get all wallet tokens with comprehensive information and balances
 */
export const getWalletTokens = async (walletAddress: string): Promise<WalletTokenInfo[]> => {
  try {
    // Fetch wallet balances from Helius
    const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${process.env.REACT_APP_HELIUS_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet tokens');
    }

    const data = await response.json();
    const tokens: WalletTokenInfo[] = [];

    // Add SOL balance
    if (data.nativeBalance && data.nativeBalance > 0) {
      const solInfo = await getTokenInfo(SOLANA_TOKEN_ADDRESSES.SOL);
      if (solInfo) {
        tokens.push({
          ...solInfo,
          balance: data.nativeBalance / 1e9, // Convert lamports to SOL
        });
      } else {
        // Fallback SOL info
        tokens.push({
          address: SOLANA_TOKEN_ADDRESSES.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          balance: data.nativeBalance / 1e9,
        });
      }
    }

    // Add SPL tokens with balances > 0
    if (data.tokens && Array.isArray(data.tokens)) {
      const tokenPromises = data.tokens
        .filter((token: any) => token.amount > 0)
        .map(async (token: any) => {
          const tokenInfo = await getTokenInfo(token.mint);
          if (tokenInfo) {
            return {
              ...tokenInfo,
              balance: token.amount / Math.pow(10, tokenInfo.decimals),
            };
          }
          return null;
        });

      const resolvedTokens = await Promise.all(tokenPromises);
      tokens.push(...resolvedTokens.filter((token): token is WalletTokenInfo => token !== null));
    }

    return tokens;
  } catch (error) {
    console.error('Failed to get wallet tokens:', error);
    return [];
  }
};

/**
 * Get a quote for swapping tokens
 */
export const getJupiterQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50 // 0.5% slippage
): Promise<JupiterQuoteResponse | null> => {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JUPITER_API_URL}/quote?${params}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get Jupiter quote:', error);
    return null;
  }
};

/**
 * Get swap transaction from Jupiter
 */
export const getJupiterSwap = async (
  quote: JupiterQuoteResponse,
  userPublicKey: string,
  wrapAndUnwrapSol: boolean = true
): Promise<JupiterSwapResponse | null> => {
  try {
    const response = await fetch(`${JUPITER_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol,
        // Use free tier - no additional features
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`Jupiter swap failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get Jupiter swap:', error);
    return null;
  }
};

// Common token addresses for Solana
export const SOLANA_TOKEN_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  BSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WEN: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
  JITO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  JITOSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  HNT: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  // Additional popular DeFi tokens
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt', // Serum
  FTT: 'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3', // FTX Token
  COPE: '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh', // Cope
  STEP: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT', // Step Finance
  MEDIA: 'ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs', // Media Network
  ROPE: '8PMHT4swUMtBzgHnh5U564N5sjPSiUz2cjEQzFnnP1Fo', // Rope Token
  TULIP: 'TuLipcqtGVXP9XR62wM8WWCm6a9vhLs7T1uoWBk6FDs', // Tulip Protocol
  // Meme tokens that are popular
  SAMO: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // Samoyed
  FIDA: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp', // Bonfida
  KIN: 'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6', // Kin
  MAPS: 'MAPS41MDahZ9QdKXhVa4dWB9RuyfV4XqhyAZ8XcYepb', // Maps
  // Additional popular tokens
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // Orca
  MER: 'MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K', // Mercurial
  PORT: 'PoRTjZMPXb9T7dyU7tpLEZRQj7e6ssfAE62j2oQuc6y', // Port Finance
  SBR: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', // Saber
  SUNNY: 'SUNNY4wTQWzbpREpCyFaH6qXZnApJ4VdAhJDYhSK47iJ', // Sunny
  // Newer popular tokens
  DUST: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', // Dust Protocol
  STAR: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx', // Star Atlas
  POLIS: 'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk', // Star Atlas DAO
  GENE: 'GENEtH5amGSi8kHAtQoezp1XEXwZJ8vcuePYnXdKrMYz', // Genopets
  // Additional DeFi and utility tokens
  MNGO: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', // Mango
  SNY: 'SNYjXPLfQmsAhz9Lp1YkE6AeXyD98dSwg4TzCjGy1iNj', // Synthetify
  DFL: 'DFL1zNkaGPWm1BqAVqRjCZvHmwTFrEaJtbzJWgseoNJh', // DeFiLand
};

/**
 * Format amount for display (with proper decimals)
 */
export const formatTokenAmount = (amount: string | number, decimals: number = 6): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  const divisor = Math.pow(10, decimals);
  const formatted = (num / divisor).toFixed(decimals);
  
  // Remove trailing zeros
  return parseFloat(formatted).toString();
};

/**
 * Convert display amount to raw amount (with decimals)
 */
export const toRawAmount = (amount: number, decimals: number = 6): number => {
  return Math.floor(amount * Math.pow(10, decimals));
};
