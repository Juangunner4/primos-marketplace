import { fetchCoinGeckoData, fetchSimpleTokenPrice } from '../coingecko';

// Mock the global fetch function
global.fetch = jest.fn();

describe('coingecko service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Mock rate limiting
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fetchSimpleTokenPrice calls CoinGecko API', async () => {
    const mockResponse = {
      'test-contract': {
        usd: 1.23,
        usd_market_cap: 1000000,
        usd_24h_vol: 50000,
        usd_24h_change: 5.5
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await fetchSimpleTokenPrice('test-contract', 'solana');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.coingecko.com/api/v3/simple/token_price/solana'),
      undefined
    );
    expect(result).toEqual(mockResponse['test-contract']);
  });

  test('fetchCoinGeckoData handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });

    const result = await fetchCoinGeckoData('invalid-contract');
    expect(result).toEqual([]);
  });
});
