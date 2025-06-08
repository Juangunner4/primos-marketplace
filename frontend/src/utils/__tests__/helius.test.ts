import { getAssetsByCollection, getNFTByTokenAddress } from '../helius';

describe('helius utilities', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = undefined;
  });

  test('getAssetsByCollection filters by owner and maps fields', async () => {
    const response = {
      ok: true,
      json: async () => ({
        result: {
          items: [
            {
              id: '1',
              content: { links: { image: 'img' }, metadata: { name: 'nft' }, files: [] },
              listing: {},
              ownership: { owner: 'owner1' },
            },
          ],
        },
      }),
    };
    (global as any).fetch = jest.fn().mockResolvedValue(response);
    const assets = await getAssetsByCollection('col', 'owner1');
    expect(assets).toEqual([{ id: '1', image: 'img', name: 'nft', listed: true }]);
  });

  test('getAssetsByCollection returns empty on non-ok', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false });
    const assets = await getAssetsByCollection('c', 'o');
    expect(assets).toEqual([]);
  });

  test('getNFTByTokenAddress fetches metadata and caches', async () => {
    const response = {
      ok: true,
      json: async () => ({
        result: {
          id: 'id',
          content: { links: { image: 'img' }, metadata: { name: 'name' } },
          listing: {},
        },
      }),
    };
    const mockFetch = jest.fn().mockResolvedValue(response);
    (global as any).fetch = mockFetch;
    const nft = await getNFTByTokenAddress('token');
    expect(nft).toEqual({ id: 'id', image: 'img', name: 'name', listed: true });
    const cached = await getNFTByTokenAddress('token');
    expect(cached).toEqual(nft);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
