import { fetchTokenMetadata } from '../token';
import * as helius from '../helius';

jest.mock('../helius');

describe('token service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('fetchTokenMetadata maps fields', async () => {
    (helius.getNFTByTokenAddress as jest.Mock).mockResolvedValue({
      id: 'id',
      image: 'img',
      name: 'name',
      listed: false,
      metadata: {
        symbol: 'SYM',
        description: 'desc',
        showName: true,
        createdOn: 'source',
        twitter: 'tw',
      },
    });
    const meta = await fetchTokenMetadata('c1');
    expect(meta).toEqual({
      name: 'name',
      symbol: 'SYM',
      description: 'desc',
      image: 'img',
      showName: true,
      createdOn: 'source',
      twitter: 'tw',
    });
  });

  test('fetchTokenMetadata returns null on missing data', async () => {
    (helius.getNFTByTokenAddress as jest.Mock).mockResolvedValue(null);
    const meta = await fetchTokenMetadata('c1');
    expect(meta).toBeNull();
  });
});
