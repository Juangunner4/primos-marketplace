import { fetchTrenchData, submitTrenchContract } from '../trench';
import api from '../../utils/api';
import * as helius from '../helius';

jest.mock('../../utils/api');
jest.mock('../helius');

describe('trench service', () => {
  test('fetchTrenchData enriches images', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        contracts: [{ contract: 'c1', count: 1 }],
        users: [{ publicKey: 'u1', pfp: '', count: 1, contracts: [] }],
      },
    });
    (helius.getNFTsByTokenAddresses as jest.Mock).mockResolvedValue({
      c1: { image: 'cimg' },
    });
    (helius.fetchCollectionNFTsForOwner as jest.Mock).mockResolvedValue([
      { image: 'uimg' },
    ]);
    const data = await fetchTrenchData();
    expect(data.contracts[0].image).toBe('cimg');
    expect(data.users[0].pfp).toBe('uimg');
    expect(api.get).toHaveBeenCalledWith('/api/trench');
  });

  test('submitTrenchContract posts to api', async () => {
    (api.post as jest.Mock).mockResolvedValue({});
    await submitTrenchContract('w1', 'c1', 'm1');
    expect(api.post).toHaveBeenCalledWith(
      '/api/trench',
      { contract: 'c1', source: 'website', model: 'm1' },
      { headers: { 'X-Public-Key': 'w1' } }
    );
  });
});
