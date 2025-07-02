import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import WalletLogin from '../WalletLogin';
import i18n from '../../i18n';

jest.mock('../../hooks/usePrivyWallet', () => ({
  usePrivyWallet: () => ({ publicKey: null, login: jest.fn(), logout: jest.fn() })
}));

describe('WalletLogin', () => {
  test('renders login button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WalletLogin />
      </I18nextProvider>
    );
    expect(screen.getByText(/Connect Wallet/i)).toBeTruthy();
  });
});
