import api from '../utils/api';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from './helius';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION ?? '';

export const fetchUserPfpImage = async (publicKey: string): Promise<string> => {
  try {
    const res = await api.get<{ pfp?: string }>(`/api/user/${publicKey}`);
    const pfpAddr = res.data?.pfp?.replace(/"/g, '');
    if (pfpAddr) {
      try {
        const nft = await getNFTByTokenAddress(pfpAddr);
        return nft?.image || '';
      } catch {
        // continue to fallback
      }
    }
    const nfts = await fetchCollectionNFTsForOwner(publicKey, PRIMO_COLLECTION);
    return nfts[0]?.image || '';
  } catch (err) {
    return '';
  }
};

