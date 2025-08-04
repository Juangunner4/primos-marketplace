import * as coingecko from '../coingecko';

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

    const result = await coingecko.fetchSimpleTokenPrice('test-contract', 'solana');
    
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/coingecko/simple/token_price/solana'),
        undefined
      );
      expect(result).toEqual(mockResponse['test-contract']);
    });

  test('fetchCoinGeckoData handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });

      const result = await coingecko.fetchCoinGeckoData('invalid-contract');
      expect(result).toEqual([]);
    });

    test('fetchCoinGeckoData returns formatted entries', async () => {
      (coingecko.fetchSimpleTokenPrice as jest.Mock).mockResolvedValue({
        usd: 1,
        usd_market_cap: 2000000,
        usd_24h_vol: 100000,
        usd_24h_change: 2,
        last_updated_at: 1700000000,
      });

      const result = await coingecko.fetchCoinGeckoData('test-contract');

      expect(result).toEqual([
        { id: 'price', label: 'price', value: '$1.00000000', change: '2.00%' },
        { id: 'market_cap', label: 'market_cap', value: '$2.00M' },
        { id: 'volume_24h', label: 'volume_24h', value: '$0.10M' },
        { id: 'last_updated', label: 'last_updated', value: expect.any(String) },
      ]);
    });
  });
