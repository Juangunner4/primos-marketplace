import { getDomainOwner, verifyDomainOwnership } from '../sns';
import { resolve } from '@bonfida/spl-name-service';
import { PublicKey } from '@solana/web3.js';

jest.mock('@bonfida/spl-name-service', () => ({
  resolve: jest.fn(),
}));

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(() => ({})),
  PublicKey: jest.fn((val: string) => ({ toBase58: () => val })),
}));

describe('sns utils', () => {
  afterEach(() => jest.resetAllMocks());

  test('getDomainOwner returns owner string', async () => {
    (resolve as jest.Mock).mockResolvedValue(new PublicKey('owner'));
    const owner = await getDomainOwner('name.sol');
    expect(owner).toBe('owner');
  });

  test('verifyDomainOwnership true when owner matches', async () => {
    (resolve as jest.Mock).mockResolvedValue(new PublicKey('owner'));
    const result = await verifyDomainOwnership('name.sol', 'owner');
    expect(result).toBe(true);
  });

  test('verifyDomainOwnership false when owner mismatched', async () => {
    (resolve as jest.Mock).mockResolvedValue(new PublicKey('owner'));
    const result = await verifyDomainOwnership('name.sol', 'other');
    expect(result).toBe(false);
  });

  test('verifyDomainOwnership false on resolve failure', async () => {
    (resolve as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await verifyDomainOwnership('bad.sol', 'owner');
    expect(result).toBe(false);
  });
});
