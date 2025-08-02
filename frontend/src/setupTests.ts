import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null, connected: false })
}));

jest.mock('./utils/sns', () => ({
  verifyDomainOwnership: jest.fn(async () => false),
  getPrimaryDomainName: jest.fn(async () => null)
}));
