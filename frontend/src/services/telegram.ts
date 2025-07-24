export interface TelegramEntry {
  id: string;
  message: string;
  time: string;
}


import api from '../utils/api';

export const fetchTelegramData = async (
  contract: string
): Promise<TelegramEntry[]> => {
  try {
    const res = await api.get<TelegramEntry[]>(`/api/telegram/${contract}`);
    return res.data;
  } catch (error) {
    console.error('fetchTelegramData error', error);
    return [];
  }
};
