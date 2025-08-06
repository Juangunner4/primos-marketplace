import api from './api';

export interface TokenReactionData {
  likes: number;
  dislikes: number;
  userReaction: 'LIKE' | 'DISLIKE' | null;
}

export const getTokenReactions = async (tokenId: string, wallet?: string): Promise<TokenReactionData> => {
  const res = await api.get(`/api/token-reactions/${tokenId}`, wallet ? { headers: { 'X-Public-Key': wallet } } : undefined);
  return res.data as TokenReactionData;
};

export const toggleTokenLike = async (tokenId: string, wallet: string): Promise<TokenReactionData> => {
  const res = await api.post(`/api/token-reactions/${tokenId}/like`, {}, { headers: { 'X-Public-Key': wallet } });
  return res.data as TokenReactionData;
};

export const toggleTokenDislike = async (tokenId: string, wallet: string): Promise<TokenReactionData> => {
  const res = await api.post(`/api/token-reactions/${tokenId}/dislike`, {}, { headers: { 'X-Public-Key': wallet } });
  return res.data as TokenReactionData;
};
