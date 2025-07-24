export const FEE_MARKET_TAKER = 0.02;
export const FEE_CREATOR_ROYALTY = 0.05;
export const FEE_COMMUNITY = 0.02;
export const FEE_OPERATIONS = 0.005;

export const TOTAL_FEE_RATE =
  FEE_MARKET_TAKER + FEE_CREATOR_ROYALTY + FEE_COMMUNITY + FEE_OPERATIONS;

export interface FeeBreakdown {
  marketTaker: number;
  creatorRoyalty: number;
  community: number;
  operations: number;
  totalFees: number;
  sellerReceives: number;
}

export const calculateFees = (priceSol: number): FeeBreakdown => {
  const marketTaker = priceSol * FEE_MARKET_TAKER;
  const creatorRoyalty = priceSol * FEE_CREATOR_ROYALTY;
  const community = priceSol * FEE_COMMUNITY;
  const operations = priceSol * FEE_OPERATIONS;
  const totalFees = marketTaker + creatorRoyalty + community + operations;
  const sellerReceives = priceSol - totalFees;
  return { marketTaker, creatorRoyalty, community, operations, totalFees, sellerReceives };
};
