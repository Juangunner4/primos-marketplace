import { getPythSolPriceOnChain } from '../pyth';
import { Connection } from '@solana/web3.js';

jest.useFakeTimers();

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({})),
  PublicKey: jest.fn(),
}));

let onPriceChangeCallback: any;
class MockPythConnection {
  onPriceChange(cb: any) { onPriceChangeCallback = cb; }
  start = jest.fn();
}

jest.mock('@pythnetwork/client', () => ({
  getPythProgramKeyForCluster: jest.fn(),
  PythConnection: jest.fn().mockImplementation(() => new MockPythConnection()),
}));

describe('getPythSolPriceOnChain', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('resolves when price update received', async () => {
    const promise = getPythSolPriceOnChain();
    onPriceChangeCallback({ symbol: 'Crypto.SOL/USD' }, { price: 55 });
    jest.runAllTimers();
    const price = await promise;
    expect(price).toBe(55);
  });

  test('returns null on error', async () => {
    (Connection as jest.Mock).mockImplementationOnce(() => { throw new Error('fail'); });
    const price = await getPythSolPriceOnChain();
    expect(price).toBeNull();
  });
});
