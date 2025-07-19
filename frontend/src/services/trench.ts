export type { HeliusNFT } from './helius';
import api from '../utils/api';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from './helius';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION!;

export interface TrenchContract {
  contract: string;
  count: number;
}

export interface TrenchUser {
  publicKey: string;
  pfp: string;
  count: number;
  contracts: string[];
}

export interface TrenchData {
  contracts: TrenchContract[];
  users: TrenchUser[];
}

export const fetchTrenchData = async (): Promise<TrenchData> => {
  const res = await api.get<TrenchData>('/api/trench');
  const users = await Promise.all(
    res.data.users.map(async (u) => {
      let image = '';
      if (u.pfp) {
        const nft = await getNFTByTokenAddress(u.pfp.replace(/"/g, ''));
        image = nft?.image || '';
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
  return { contracts: res.data.contracts, users };
};

export const submitTrenchContract = async (
  publicKey: string,
  contract: string
): Promise<void> => {
  await api.post(
    '/api/trench',
    { contract },
    { headers: { 'X-Public-Key': publicKey } }
  );
};
