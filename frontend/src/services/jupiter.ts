export interface JupiterTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
}

/**
 * Fetch token information from Jupiter API
 */
export const fetchJupiterTokenInfo = async (tokenAddress: string): Promise<JupiterTokenInfo | null> => {
  try {
    // Use Jupiter's token list API
    const response = await fetch('https://token.jup.ag/all');
    const tokens: JupiterTokenInfo[] = await response.json();
    
    const token = tokens.find(t => t.address === tokenAddress);
    return token || null;
  } catch (error) {
    console.warn('Failed to fetch Jupiter token info:', error);
    return null;
  }
};

/**
 * Get chart symbol for TradingView based on token information
 * For pump.fun tokens like Fartcoin, use specific known symbols
 */
export const getChartSymbol = async (contract: string, tokenSymbol?: string): Promise<string | null> => {
  // Special case for known tokens with verified TradingView symbols
  const knownTokens: Record<string, string> = {
    '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump': 'CRYPTO:FARTCOINUSD',
    // Add more known mappings here as needed
  };

  if (knownTokens[contract]) {
    return knownTokens[contract];
  }

  // If we have a symbol, try different combinations
  if (tokenSymbol) {
    // For Solana tokens, try crypto exchange format first, then other formats
    const possibleSymbols = [
      `CRYPTO:${tokenSymbol.toUpperCase()}USD`,    // TradingView crypto format (like CRYPTO:FARTCOINUSD)
      `${tokenSymbol}/USD`,                        // Alternative format
      `${tokenSymbol}USD`,                         // Simple format
      `${tokenSymbol}USDT`,                        // USDT pair
      `BYBIT:${tokenSymbol}USD`,                   // Exchange specific
      `MEXC:${tokenSymbol}USD`,                    // Exchange specific
      tokenSymbol,                                 // Just the symbol
    ];
    
    // Return the first one (most likely to work for pump.fun tokens)
    return possibleSymbols[0];
  }
  
  // Try to get symbol from Jupiter
  try {
    const jupiterInfo = await fetchJupiterTokenInfo(contract);
    if (jupiterInfo?.symbol) {
      return `CRYPTO:${jupiterInfo.symbol.toUpperCase()}USD`;
    }
  } catch (error) {
    console.warn('Failed to get Jupiter info for chart symbol:', error);
  }
  
  // Final fallback - use contract address
  return contract;
};
