export interface TelegramEntry {
  id: string;
  message: string;
  time: string;
}

import api from '../utils/api';

export const fetchTelegramData = async (
  contract: string
): Promise<TelegramEntry[]> => {
  const res = await api.get<TelegramEntry[]>(`/api/telegram/${contract}`);
  return res.data;
};
