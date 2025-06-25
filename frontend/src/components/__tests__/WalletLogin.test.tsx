import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import WalletLogin from '../WalletLogin';
import i18n from '../../i18n';

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
    render(
      <I18nextProvider i18n={i18n}>
        <WalletLogin />
      </I18nextProvider>
    );
    expect(screen.getByText(/WalletButton/i)).toBeTruthy();
  });

  test('opens wallet modal on mount when not connected', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WalletLogin />
      </I18nextProvider>
    );
    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });
});
