import { getNFTByTokenAddress, getTokenInfo as heliusGetTokenInfo } from './helius';
import { getCurrentMarketCap, fetchNFTWithCoinGeckoBackup } from './coingecko';
import type { HeliusTokenInfo } from './helius';

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  showName?: boolean;
  createdOn?: string;
  twitter?: string;
  // Enhanced with CoinGecko data
  collectionData?: {
    floorPrice?: string;
    marketCap?: string;
    volume24h?: string;
    totalSupply?: string;
    uniqueHolders?: string;
  };
}

export const fetchTokenMetadata = async (
  contract: string
): Promise<TokenMetadata | null> => {
  try {
    const nft = await getNFTByTokenAddress(contract);
    if (!nft?.metadata) return null;
    const meta = nft.metadata as any;
    return {
      name: meta.name || nft.name,
      symbol: meta.symbol,
      description: meta.description,
      image: nft.image || meta.image,
      showName: meta.showName,
      createdOn: meta.createdOn,
      twitter: meta.twitter,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Enhanced NFT metadata fetch with CoinGecko collection data as backup
 * @param tokenAddress - NFT token address
 * @param collectionAddress - Optional collection address for CoinGecko backup
 * @param network - Network identifier (default: solana)
 * @returns Enhanced NFT metadata with collection data
 */
export const fetchNFTMetadataWithBackup = async (
  tokenAddress: string,
  collectionAddress?: string,
  network: string = 'solana'
): Promise<TokenMetadata | null> => {
  try {
    // Try CoinGecko backup service first
    const enhancedNFT = await fetchNFTWithCoinGeckoBackup(tokenAddress, collectionAddress, network);
    
    if (enhancedNFT) {
      const metadata: TokenMetadata = {
        name: enhancedNFT.name,
        symbol: enhancedNFT.symbol,
        description: enhancedNFT.description,
        image: enhancedNFT.image,
        showName: enhancedNFT.metadata?.showName as boolean,
        createdOn: enhancedNFT.metadata?.createdOn as string,
        twitter: enhancedNFT.metadata?.twitter as string,
      };

      // Add collection data if available from CoinGecko
      if (enhancedNFT.coinGeckoData?.formatted_entries) {
        const entries = enhancedNFT.coinGeckoData.formatted_entries;
        const collectionData: TokenMetadata['collectionData'] = {};
        
        entries.forEach(entry => {
          switch (entry.id) {
            case 'floor_price':
              collectionData.floorPrice = entry.value;
              break;
            case 'market_cap':
              collectionData.marketCap = entry.value;
              break;
            case 'volume_24h':
              collectionData.volume24h = entry.value;
              break;
            case 'total_supply':
              collectionData.totalSupply = entry.value;
              break;
            case 'unique_holders':
              collectionData.uniqueHolders = entry.value;
              break;
          }
        });
        
        if (Object.keys(collectionData).length > 0) {
          metadata.collectionData = collectionData;
        }
      }

      return metadata;
    }

    // Fallback to original Helius-only method
    return await fetchTokenMetadata(tokenAddress);
  } catch (error) {
    console.error('fetchNFTMetadataWithBackup error', error);
    // Final fallback to original method
    return await fetchTokenMetadata(tokenAddress);
  }
};

export type TokenInfo = HeliusTokenInfo;

// Fetches token market data using Helius for Solana tokens and
// Coingecko for EVM tokens (e.g. Ethereum). Falls back to the Helius
// `getAsset` endpoint to compute market cap when missing.
export const fetchTokenInfo = async (
  contract: string
): Promise<TokenInfo | null> => {
  // Ethereum addresses start with 0x and are 42 characters long
  if (/^0x[0-9a-fA-F]{40}$/.test(contract)) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contract}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const ticker = data.tickers?.[0];
      return {
        tickerBase: ticker?.base,
        tickerTarget: ticker?.target,
        tickerMarketName: ticker?.market?.name,
        marketCap: data.market_data?.market_cap?.usd,
        priceUsd: data.market_data?.current_price?.usd,
        fdvUsd: data.market_data?.fully_diluted_valuation?.usd,
        volume24hUsd: data.market_data?.total_volume?.usd,
        change1hPercent:
          data.market_data?.price_change_percentage_1h_in_currency?.usd,
      };
    } catch (e) {
      console.error('fetchTokenInfo (coingecko) error', e);
      return null;
    }
  }

  try {
    // First attempt to use Helius getTokenInfo
    const info = await heliusGetTokenInfo(contract);
    if (info?.priceUsd != null && info?.marketCap != null) {
      return info;
    }

    // Fallback to getAsset to compute price and market cap
    const apiKey = process.env.REACT_APP_HELIUS_API_KEY;
    if (!apiKey) return info;
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAsset',
          params: {
            id: contract,
            displayOptions: { showFungibleTokens: true },
          },
        }),
      }
    );
    if (!response.ok) return info;
    const data = await response.json();
    const tokenInfo = data.result?.token_info;
    if (!tokenInfo?.price_info) return info;
    const price = tokenInfo.price_info.price_per_token as number;
    const { supply, decimals } = tokenInfo;
    const adjustedSupply = supply / Math.pow(10, decimals);
    const marketCap = price * adjustedSupply;
    return { ...info, priceUsd: price, marketCap };
  } catch (e) {
    console.error('fetchTokenInfo (helius) error', e);
    return null;
  }
};

/**
 * Get current market cap for a token (used for trench tracking)
 * @param contract - Token contract address
 * @returns Current market cap or null
 */
export const getCurrentTokenMarketCap = async (
  contract: string
): Promise<number | null> => {
  // Try CoinGecko first for Solana tokens
  if (!/^0x[0-9a-fA-F]{40}$/.test(contract)) {
    const marketCap = await getCurrentMarketCap(contract, 'solana');
    if (marketCap) return marketCap;
  }

  // Fallback to existing token info methods
  const tokenInfo = await fetchTokenInfo(contract);
  return tokenInfo?.marketCap || null;
};
