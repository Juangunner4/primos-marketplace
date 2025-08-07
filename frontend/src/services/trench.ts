export type { HeliusNFT } from './helius';
import api from '../utils/api';
import { getNFTsByTokenAddresses } from './helius';
import { enrichUsersWithPfp } from './user';

// Gracefully handle missing env variable to avoid runtime crashes.
const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION ?? '';

export interface TrenchContract {
  contract: string;
  count: number;
  source?: string;
  model?: string;
  image?: string;
  firstCaller?: string;
  firstCallerAt?: number;
  firstCallerMarketCap?: number;
  firstCallerDomain?: string;
  marketCap?: number;
  priceChange24h?: number;
}

export interface TrenchUser {
  publicKey: string;
  pfp: string;
  count: number;
  contracts: string[];
  lastSubmittedAt?: number;
  socials?: {
    twitter?: string;
    discord?: string;
    website?: string;
    slingshot?: string;
    axiom?: string;
    vector?: string;
  };
}

export interface TrenchCallerInfo {
  caller: string;
  pfp: string;
  calledAt?: number;
  marketCapAtCall?: number;
  domainAtCall?: string;
  socials?: {
    twitter?: string;
    discord?: string;
    website?: string;
    slingshot?: string;
    axiom?: string;
    vector?: string;
  };
}

export interface TrenchData {
  contracts: TrenchContract[];
  users: TrenchUser[];
  latestCallers: Record<string, TrenchCallerInfo[]>;
}

export const fetchTrenchData = async (): Promise<TrenchData> => {
  const res = await api.get<TrenchData>('/api/trench');

  const resData = (res.data || {}) as Partial<TrenchData>;
  const contractsArr = Array.isArray(resData.contracts) ? resData.contracts : [];
  const usersArr = Array.isArray(resData.users) ? resData.users : [];
  const latestCallersRaw =
    resData.latestCallers && typeof resData.latestCallers === 'object'
      ? resData.latestCallers
      : {};

  const contractAddresses = contractsArr.map((c) => c.contract);
  const userPfpAddresses = usersArr
    .map((u) => u.pfp?.replace(/"/g, ''))
    .filter((a): a is string => !!a);

  // Get all caller PFP addresses from latest callers
  const latestCallerPfpAddresses = Object.values(latestCallersRaw)
    .flat()
    .map((caller) => caller.pfp?.replace(/"/g, ''))
    .filter((a): a is string => !!a);

  const nftMap = await getNFTsByTokenAddresses([
    ...contractAddresses,
    ...userPfpAddresses,
    ...latestCallerPfpAddresses,
  ]);

  const contracts = contractsArr.map((c) => ({
    ...c,
    image: nftMap[c.contract]?.image,
  }));

  // Use enrichUsersWithPfp for users but with manual NFT mapping for efficiency
  const enrichedUsers = await enrichUsersWithPfp(usersArr, { useCache: false });
  const users = enrichedUsers.map((u) => ({
    ...u,
    pfp: u.pfpImage || (u.pfp?.replace(/"/g, '') && nftMap[u.pfp.replace(/"/g, '')]?.image) || ''
  })) as TrenchUser[];

  // Process latest callers data
  const latestCallers: Record<string, TrenchCallerInfo[]> = {};
  for (const [contract, callers] of Object.entries(latestCallersRaw)) {
    const enrichedCallers = await enrichUsersWithPfp(
      callers.map(caller => ({ ...caller, publicKey: caller.caller })),
      { useCache: false }
    );
    latestCallers[contract] = enrichedCallers.map((caller) => ({
      ...caller,
      pfp: caller.pfpImage || (caller.pfp?.replace(/"/g, '') && nftMap[caller.pfp.replace(/"/g, '')]?.image) || ''
    })) as TrenchCallerInfo[];
  }

  return { contracts, users, latestCallers };
};

export const submitTrenchContract = async (
  publicKey: string,
  contract: string,
  model?: string,
  marketCap?: number,
  domain?: string
): Promise<void> => {
  const payload: any = { contract, source: 'website' };
  if (model) payload.model = model;
  if (marketCap) payload.marketCap = marketCap.toString();
  if (domain) payload.domain = domain;

  await api.post(
    '/api/trench',
    payload,
    { headers: { 'X-Public-Key': publicKey } }
  );
};

export const updateContractMarketCap = async (
  contract: string,
  marketCap: number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/api/trench/${contract}/market-cap`, {
    marketCap
  });
  return response.data;
};
