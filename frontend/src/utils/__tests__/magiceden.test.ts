import { getMagicEdenStats, getMagicEdenHolderStats, fetchMagicEdenListings, fetchMagicEdenActivity } from '../magiceden';

describe('magiceden utilities', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = undefined;
  });

  test('getMagicEdenStats returns parsed stats', async () => {
    const response = {
      ok: true,
      json: async () => ({ floorPrice: 1, listedCount: 2 }),
    };
    (global as any).fetch = jest.fn().mockResolvedValue(response);
    const stats = await getMagicEdenStats('sym');
    expect(stats).toEqual({ floorPrice: 1, listedCount: 2, listedTotalValue: null, volumeAll: null, avgPrice24hr: null, volume24hr: null });
  });

  test('getMagicEdenHolderStats returns data', async () => {
    const response = { ok: true, json: async () => ({ totalSupply: 1 }) };
    (global as any).fetch = jest.fn().mockResolvedValue(response);
    const data = await getMagicEdenHolderStats('sym');
    expect(data).toEqual({ totalSupply: 1 });
  });

  test('fetchMagicEdenListings sorts by price', async () => {
    const response = { ok: true, json: async () => ([{ price: 5 }, { price: 2 }]) };
    (global as any).fetch = jest.fn().mockResolvedValue(response);
    const list = await fetchMagicEdenListings('sym');
    expect(list[0].price).toBe(2);
    expect(list[1].price).toBe(5);
  });

  test('fetchMagicEdenActivity returns empty on error', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('fail'));
    const list = await fetchMagicEdenActivity('sym');
    expect(list).toEqual([]);
  });
});
