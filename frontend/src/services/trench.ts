export type { HeliusNFT } from './helius';
import api from '../utils/api';
import { getNFTsByTokenAddresses, fetchCollectionNFTsForOwner } from './helius';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

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

  const contractAddresses = res.data.contracts.map((c) => c.contract);
  const userPfpAddresses = res.data.users
    .map((u) => u.pfp?.replace(/"/g, ''))
    .filter((a): a is string => !!a);
  
  // Get all caller PFP addresses from latest callers
  const latestCallerPfpAddresses = Object.values(res.data.latestCallers || {})
    .flat()
    .map((caller) => caller.pfp?.replace(/"/g, ''))
    .filter((a): a is string => !!a);

  const nftMap = await getNFTsByTokenAddresses([
    ...contractAddresses,
    ...userPfpAddresses,
    ...latestCallerPfpAddresses,
  ]);

  const contracts = res.data.contracts.map((c) => ({
    ...c,
    image: nftMap[c.contract]?.image,
  }));

  const users = await Promise.all(
    res.data.users.map(async (u) => {
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
  for (const [contract, callers] of Object.entries(res.data.latestCallers || {})) {
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
