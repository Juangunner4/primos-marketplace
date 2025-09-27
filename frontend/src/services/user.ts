import api from '../utils/api';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from './helius';

const WEY_COLLECTION = process.env.REACT_APP_WEYS_COLLECTION ?? '';

export interface UserWithPfpImage {
  pfp?: string;
  pfpImage?: string;
  [key: string]: any;
}

// Single PFP resolution utility
export const resolvePfpImage = async (pfp?: string, fallbackPublicKey?: string): Promise<string> => {
  
  // PRIORITY 1: Try to resolve the backend-stored PFP first if it exists
  if (pfp && pfp !== 'null' && pfp !== 'undefined') {
    try {
      // If pfp is already a URL, use directly
      if (pfp.startsWith('http')) {
        return pfp;
      }
      
      // Otherwise treat as token address for Wey NFT stored in backend
      const tokenAddress = pfp.replace(/"/g, '');
      const nft = await getNFTByTokenAddress(tokenAddress);
      const resolvedImage = nft?.image ?? '';
      
      if (resolvedImage) {
        return resolvedImage;
      }
    } catch (error) {
      console.warn('PFP Resolution - Failed to resolve backend-stored PFP:', error);
    }
  }
  
  // PRIORITY 2: If no valid backend PFP, fall back to first Wey collection NFT in wallet
  if (fallbackPublicKey) {
    try {
      const nfts = await fetchCollectionNFTsForOwner(fallbackPublicKey, WEY_COLLECTION);
      const weyImage = nfts[0]?.image || '';
      
      if (weyImage) {
        return weyImage;
      }
    } catch (error) {
      console.warn('PFP Resolution - Failed to fetch Wey collection NFTs for user:', fallbackPublicKey, error);
    }
  }
  return '';
};

// Enrich single user with a resolved PFP image. The backend-stored PFP is
// preferred, falling back to the first Wey collection NFT owned by the
// provided public key when necessary.
export const enrichUserWithPfp = async <T extends { pfp?: string }>(
  user: T,
  fallbackPublicKey?: string
): Promise<T & { pfpImage: string }> => {
  const pfpImage = await resolvePfpImage(user.pfp, fallbackPublicKey);
  return { ...user, pfpImage };
};

// Batch enrich users with PFP images using a unified resolution path
export const enrichUsersWithPfp = async <T extends { pfp?: string; publicKey?: string }>(
  users: T[],
  options: { useCache?: boolean } = {}
): Promise<(T & { pfpImage: string })[]> => {
  const { useCache = true } = options;
  const nftCache = new Map<string, string>();

  return Promise.all(
    users.map(async (user) => {
      const cacheKey = user.pfp ? user.pfp.replace(/"/g, '') : user.publicKey || '';

      if (useCache && nftCache.has(cacheKey)) {
        return { ...user, pfpImage: nftCache.get(cacheKey)! };
      }

      const pfpImage = await resolvePfpImage(user.pfp, user.publicKey);

      if (useCache) {
        nftCache.set(cacheKey, pfpImage);
      }

      return { ...user, pfpImage };
    })
  );
};

// Legacy function - kept for backward compatibility
export const fetchUserPfpImage = async (publicKey: string): Promise<string> => {
  
  // PRIORITY 1: Get backend-stored PFP first
  try {
    const res = await api.get<{ pfp?: string }>(`/api/user/${publicKey}`);
    const pfpAddr = res.data?.pfp?.replace(/"/g, '');
    
    if (pfpAddr && pfpAddr !== 'null' && pfpAddr !== 'undefined') {
      try {
        const nft = await getNFTByTokenAddress(pfpAddr);
        const pfpImage = nft?.image || '';
        if (pfpImage) {
          return pfpImage;
        }
      } catch (nftError) {
      }
    }
  } catch (err) {
    console.warn('User Service - Failed to fetch user data:', err);
  }
  
  // PRIORITY 2: If no valid backend PFP, fall back to first Wey collection NFT in wallet
  try {
    const nfts = await fetchCollectionNFTsForOwner(publicKey, WEY_COLLECTION);
    const weyImage = nfts[0]?.image || '';
    
    if (weyImage) {
      return weyImage;
    }
  } catch (error) {
    console.warn('User Service - Failed to fetch Wey collection NFTs:', error);
  }
  return '';
};

