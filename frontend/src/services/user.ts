import api from '../utils/api';
import { getNFTByTokenAddress, fetchCollectionNFTsForOwner } from './helius';

const PRIMO_COLLECTION = process.env.REACT_APP_PRIMOS_COLLECTION ?? '';

export interface UserWithPfpImage {
  pfp?: string;
  pfpImage?: string;
  [key: string]: any;
}

// Single PFP resolution utility
export const resolvePfpImage = async (pfp?: string, fallbackPublicKey?: string): Promise<string> => {
  if (!pfp) {
    // If no PFP but we have a public key, try to fetch user's collection NFT as fallback
    if (fallbackPublicKey) {
      try {
        const userPfpImage = await fetchUserPfpImage(fallbackPublicKey);
        return userPfpImage;
      } catch (error) {
        console.warn('Failed to fetch fallback PFP for user:', fallbackPublicKey, error);
        return '';
      }
    }
    return '';
  }
  
  try {
    // If pfp is already a URL, use directly
    if (pfp.startsWith('http')) {
      return pfp;
    }
    
    // Otherwise treat as token address
    const tokenAddress = pfp.replace(/"/g, '');
    const nft = await getNFTByTokenAddress(tokenAddress);
    return nft?.image ?? '';
  } catch (error) {
    console.warn('Failed to resolve PFP image:', error);
    
    // If we have a fallback public key and the main PFP failed, try the fallback
    if (fallbackPublicKey) {
      try {
        const userPfpImage = await fetchUserPfpImage(fallbackPublicKey);
        return userPfpImage;
      } catch (fallbackError) {
        console.warn('Failed to fetch fallback PFP for user:', fallbackPublicKey, fallbackError);
      }
    }
    
    return '';
  }
};

// Enrich single user with PFP image
export const enrichUserWithPfp = async <T extends { pfp?: string }>(
  user: T,
  fallbackPublicKey?: string
): Promise<T & { pfpImage: string }> => {
  let pfpImage = await resolvePfpImage(user.pfp);
  
  // Fallback: fetch any owned NFT from collection if no PFP image found
  if (!pfpImage && fallbackPublicKey) {
    try {
      const nfts = await fetchCollectionNFTsForOwner(fallbackPublicKey, PRIMO_COLLECTION);
      pfpImage = nfts[0]?.image || '';
    } catch {
      // Ignore fallback errors
    }
  }
  
  return { ...user, pfpImage };
};

// Batch enrich users with PFP images (with optional caching)
export const enrichUsersWithPfp = async <T extends { pfp?: string; publicKey?: string }>(
  users: T[],
  options: { useCache?: boolean; useFallback?: boolean } = {}
): Promise<(T & { pfpImage: string })[]> => {
  const { useCache = true, useFallback = true } = options;
  const nftCache = new Map<string, string>();
  
  return Promise.all(
    users.map(async (user) => {
      if (!user.pfp) {
        // Try fallback if enabled
        if (useFallback && user.publicKey) {
          try {
            const nfts = await fetchCollectionNFTsForOwner(user.publicKey, PRIMO_COLLECTION);
            const fallbackImage = nfts[0]?.image || '';
            return { ...user, pfpImage: fallbackImage };
          } catch {
            return { ...user, pfpImage: '' };
          }
        }
        return { ...user, pfpImage: '' };
      }
      
      const tokenAddress = user.pfp.replace(/"/g, '');
      
      // Check cache first if enabled
      if (useCache && nftCache.has(tokenAddress)) {
        return { ...user, pfpImage: nftCache.get(tokenAddress)! };
      }
      
      const pfpImage = await resolvePfpImage(user.pfp);
      
      // Cache the result
      if (useCache) {
        nftCache.set(tokenAddress, pfpImage);
      }
      
      return { ...user, pfpImage };
    })
  );
};

// Legacy function - kept for backward compatibility
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
    console.warn('Failed to fetch user PFP image:', err);
    return '';
  }
};

