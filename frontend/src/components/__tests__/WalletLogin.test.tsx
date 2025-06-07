import React from 'react';
import { render, screen } from '@testing-library/react';
import WalletLogin from '../WalletLogin';

jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <div>WalletButton</div>
}));

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ connected: false, publicKey: null })
}));

describe('WalletLogin', () => {
  test('renders wallet button', () => {
    render(<WalletLogin />);
    expect(screen.getByText(/WalletButton/i)).toBeTruthy();
  });
});
