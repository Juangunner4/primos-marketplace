import { getNFTByTokenAddress } from './helius';

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  showName?: boolean;
  createdOn?: string;
  twitter?: string;
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
    console.error('fetchTokenMetadata error', error);
    return null;
  }
};
