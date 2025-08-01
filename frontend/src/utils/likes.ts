import api from './api';

export const getLikes = async (tokenId: string, wallet?: string) => {
  const res = await api.get(`/api/likes/${tokenId}`, wallet ? { headers: { 'X-Public-Key': wallet } } : undefined);
  return res.data as { count: number; liked: boolean };
};

export const toggleLike = async (tokenId: string, wallet: string) => {
  const res = await api.post(`/api/likes/${tokenId}`, {}, { headers: { 'X-Public-Key': wallet } });
  return res.data as { count: number; liked: boolean };
};
