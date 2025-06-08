import { getPythSolPrice } from '../pyth';

describe('getPythSolPrice', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns price when response is valid', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ price: { price: '100', expo: -1 } }],
    }) as any;
    const price = await getPythSolPrice();
    expect(price).toBe(10);
  });

  test('returns null when response not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
    const price = await getPythSolPrice();
    expect(price).toBeNull();
  });

  test('returns null on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail')) as any;
    const price = await getPythSolPrice();
    expect(price).toBeNull();
  });
});
