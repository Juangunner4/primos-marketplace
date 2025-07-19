import { fetchTrenchData, submitTrenchContract } from '../trench';
import api from '../../utils/api';
import * as helius from '../helius';

jest.mock('../../utils/api');
jest.mock('../helius');

describe('trench service', () => {
  test('fetchTrenchData enriches user images', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        contracts: [{ contract: 'c1', count: 1 }],
        users: [{ publicKey: 'u1', pfp: '', count: 1, contracts: [] }],
      },
    });
    (helius.fetchCollectionNFTsForOwner as jest.Mock).mockResolvedValue([
      { image: 'img' },
    ]);
    const data = await fetchTrenchData();
    expect(data.users[0].pfp).toBe('img');
    expect(api.get).toHaveBeenCalledWith('/api/trench');
  });

  test('submitTrenchContract posts to api', async () => {
    (api.post as jest.Mock).mockResolvedValue({});
    await submitTrenchContract('w1', 'c1');
    expect(api.post).toHaveBeenCalledWith(
      '/api/trench',
      { contract: 'c1' },
      { headers: { 'X-Public-Key': 'w1' } }
    );
  });
});
