export type { HeliusNFT } from './helius';
import api from '../utils/api';
import { getNFTsByTokenAddresses, fetchCollectionNFTsForOwner } from './helius';

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

  const users = await Promise.all(
    usersArr.map(async (u) => {
      const pfpAddr = u.pfp?.replace(/"/g, '');
      let image = '';
      if (pfpAddr && nftMap[pfpAddr]) {
        image = nftMap[pfpAddr].image;
      } else {
        const nfts = await fetchCollectionNFTsForOwner(
          u.publicKey,
          PRIMO_COLLECTION
        );
        image = nfts[0]?.image || '';
      }
      return { ...u, pfp: image } as TrenchUser;
    })
  );

  // Process latest callers data
  const latestCallers: Record<string, TrenchCallerInfo[]> = {};
  for (const [contract, callers] of Object.entries(latestCallersRaw)) {
    latestCallers[contract] = await Promise.all(
      callers.map(async (caller) => {
        const pfpAddr = caller.pfp?.replace(/"/g, '');
        let image = '';
        
        if (pfpAddr && nftMap[pfpAddr]) {
          image = nftMap[pfpAddr].image;
        } else {
          const nfts = await fetchCollectionNFTsForOwner(
            caller.caller,
            PRIMO_COLLECTION
          );
          image = nfts[0]?.image || '';
        }
        
        return { ...caller, pfp: image } as TrenchCallerInfo;
      })
    );
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
