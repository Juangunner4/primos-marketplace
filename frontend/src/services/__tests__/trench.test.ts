import { fetchTrenchData, submitTrenchContract } from '../trench';
import api from '../../utils/api';
import * as helius from '../helius';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
jest.mock('../helius', () => ({
  __esModule: true,
  getNFTsByTokenAddresses: jest.fn(),
  fetchCollectionNFTsForOwner: jest.fn(),
}));

describe('trench service', () => {
  test('fetchTrenchData enriches images', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        contracts: [{ contract: 'c1', count: 1 }],
        users: [
          { publicKey: 'u1', pfp: 'p1', count: 1, contracts: [] },
          { publicKey: 'u2', pfp: '', count: 1, contracts: [] },
        ],
        latestCallers: {
          c1: [
            { caller: 'lc1', pfp: 'lp1' },
          ],
        },
      },
    });
    (helius.getNFTsByTokenAddresses as jest.Mock).mockResolvedValue({
      c1: { image: 'cimg' },
      p1: { image: 'pimg' },
    });
    (helius.fetchCollectionNFTsForOwner as jest.Mock).mockResolvedValue([
      { image: 'u2img' },
    ]);
    const data = await fetchTrenchData();
    expect(data.contracts[0].image).toBe('cimg');
    expect(data.users[0].pfp).toBe('pimg');
    expect(data.users[1].pfp).toBe('u2img');
    expect(data.latestCallers.c1[0].pfp).toBe('lp1');
    expect(helius.getNFTsByTokenAddresses).toHaveBeenCalledWith(['c1', 'p1']);
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
