import api from '../utils/api';
import { getTokensForOwner, HeliusFungibleToken } from './helius';

export interface WeyToken {
  id?: string;
  contract: string;
  holderCount: number;
  holders: string[];
  holderDetails?: any[];
  tradingViewCharts?: any[];
  name?: string;
  symbol?: string;
  image?: string;
  marketCap?: number;
  priceChange24h?: number;
}

// Fetch tokens held by Wey holders directly from the blockchain.
// Falls back to empty array if API key or holders are unavailable.
export const fetchWeyTokensOnChain = async (): Promise<WeyToken[]> => {
  try {
    const res = await api.get('/api/user/holders');
    const holders: { publicKey: string }[] = Array.isArray(res.data) ? res.data : [];

    const tokenMap: Record<string, WeyToken> = {};

    for (const holder of holders) {
      const tokens: HeliusFungibleToken[] = await getTokensForOwner(holder.publicKey);
      tokens.forEach((token) => {
        const id = token.id;
        if (!id) return;
        if (!tokenMap[id]) {
          tokenMap[id] = {
            id,
            contract: id,
            holderCount: 0,
            holders: [],
            name: token.name,
            symbol: token.symbol,
            image: token.image,
          };
        }
        tokenMap[id].holderCount += 1;
        tokenMap[id].holders.push(holder.publicKey);
      });
    }

    return Object.values(tokenMap).sort((a, b) => b.holderCount - a.holderCount);
  } catch (e) {
    console.error('Failed to fetch Wey tokens on-chain:', e);
    return [];
  }
};
