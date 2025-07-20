import { fetchTelegramData } from '../telegram';
import api from '../../utils/api';

jest.mock('../../utils/api');

describe('telegram service', () => {
  test('fetchTelegramData calls api', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    await fetchTelegramData('c1');
    expect(api.get).toHaveBeenCalledWith('/api/telegram/c1');
  });
});
