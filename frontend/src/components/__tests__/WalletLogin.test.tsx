import React from 'react';
import { render, screen } from '@testing-library/react';
import WalletLogin from '../WalletLogin';

const mockSetVisible = jest.fn();

jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <div>WalletButton</div>,
  useWalletModal: () => ({ setVisible: mockSetVisible }),
}));

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ connected: false, publicKey: null })
}));

describe('WalletLogin', () => {
  test('renders wallet button', () => {
    render(<WalletLogin />);
    expect(screen.getByText(/WalletButton/i)).toBeTruthy();
  });

  test('opens wallet modal on mount when not connected', () => {
    render(<WalletLogin />);
    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });
});
