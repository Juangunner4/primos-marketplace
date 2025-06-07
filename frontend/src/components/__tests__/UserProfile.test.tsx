import React from 'react';
import { render } from '@testing-library/react';
import UserProfile from '../UserProfile';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null })
}));

describe('UserProfile', () => {
  test('returns null when wallet not connected', () => {
    const { container } = render(<UserProfile />);
    expect(container.firstChild).toBeNull();
  });
});
