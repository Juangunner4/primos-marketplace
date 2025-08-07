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
  console.log('PFP Resolution - Called with:', { pfp, fallbackPublicKey });
  
  // PRIORITY 1: Try to resolve the backend-stored PFP first if it exists
  if (pfp && pfp !== 'null' && pfp !== 'undefined') {
    try {
      console.log('PFP Resolution - Processing backend-stored PFP value:', pfp);
      // If pfp is already a URL, use directly
      if (pfp.startsWith('http')) {
        console.log('PFP Resolution - Backend PFP is already a URL, using directly:', pfp);
        return pfp;
      }
      
      // Otherwise treat as token address for Primo NFT stored in backend
      const tokenAddress = pfp.replace(/"/g, '');
      console.log('PFP Resolution - Fetching backend-stored Primo NFT by token address:', tokenAddress);
      const nft = await getNFTByTokenAddress(tokenAddress);
      console.log('PFP Resolution - Raw backend NFT result:', nft);
      const resolvedImage = nft?.image ?? '';
      console.log('PFP Resolution - Backend NFT PFP resolved:', resolvedImage ? `"${resolvedImage}"` : 'EMPTY RESULT');
      
      if (resolvedImage) {
        console.log('PFP Resolution - Using backend-stored Primo NFT as PFP');
        return resolvedImage;
      }
    } catch (error) {
      console.warn('PFP Resolution - Failed to resolve backend-stored PFP:', error);
      console.log('PFP Resolution - Error details:', error instanceof Error ? error.message : 'Unknown error type');
    }
  }
  
  // PRIORITY 2: If no valid backend PFP, fall back to first Primo collection NFT in wallet
  if (fallbackPublicKey) {
    try {
      console.log('PFP Resolution - Backend PFP not available, checking for Primo collection NFTs in wallet for user:', fallbackPublicKey);
      const nfts = await fetchCollectionNFTsForOwner(fallbackPublicKey, PRIMO_COLLECTION);
      console.log('PFP Resolution - Primo collection NFTs result:', nfts);
      const primoImage = nfts[0]?.image || '';
      console.log('PFP Resolution - First Primo collection image found:', primoImage ? `"${primoImage}"` : 'NONE');
      
      if (primoImage) {
        console.log('PFP Resolution - Using first Primo collection NFT from wallet as fallback PFP');
        return primoImage;
      }
    } catch (error) {
      console.warn('PFP Resolution - Failed to fetch Primo collection NFTs for user:', fallbackPublicKey, error);
    }
  }
  
  console.log('PFP Resolution - No valid PFP found, returning empty string');
  return '';
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
  console.log('User Service - fetchUserPfpImage called for:', publicKey);
  
  // PRIORITY 1: Get backend-stored PFP first
  try {
    console.log('User Service - Fetching user data from API to get backend-stored PFP...');
    const res = await api.get<{ pfp?: string }>(`/api/user/${publicKey}`);
    console.log('User Service - API response:', res.data);
    const pfpAddr = res.data?.pfp?.replace(/"/g, '');
    console.log('User Service - Extracted backend PFP address:', pfpAddr);
    
    if (pfpAddr && pfpAddr !== 'null' && pfpAddr !== 'undefined') {
      try {
        console.log('User Service - Trying to resolve backend PFP address as NFT...');
        const nft = await getNFTByTokenAddress(pfpAddr);
        console.log('User Service - NFT result for backend PFP address:', nft);
        const pfpImage = nft?.image || '';
        console.log('User Service - Extracted image from backend NFT:', pfpImage);
        if (pfpImage) {
          console.log('User Service - Using backend-stored Primo NFT as PFP');
          return pfpImage;
        }
      } catch (nftError) {
        console.log('User Service - Failed to resolve backend PFP address as NFT:', nftError);
      }
    }
  } catch (err) {
    console.warn('User Service - Failed to fetch user data:', err);
  }
  
  // PRIORITY 2: If no valid backend PFP, fall back to first Primo collection NFT in wallet
  try {
    console.log('User Service - No valid backend PFP found, checking for Primo collection NFTs...');
    const nfts = await fetchCollectionNFTsForOwner(publicKey, PRIMO_COLLECTION);
    console.log('User Service - Primo collection NFTs result:', nfts);
    const primoImage = nfts[0]?.image || '';
    console.log('User Service - First Primo collection image found:', primoImage ? `"${primoImage}"` : 'NONE');
    
    if (primoImage) {
      console.log('User Service - Using first Primo collection NFT from wallet as fallback');
      return primoImage;
    }
  } catch (error) {
    console.warn('User Service - Failed to fetch Primo collection NFTs:', error);
  }
  
  console.log('User Service - No valid PFP found, returning empty string');
  return '';
};

