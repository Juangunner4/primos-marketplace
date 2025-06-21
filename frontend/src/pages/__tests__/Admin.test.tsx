import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Admin from '../Admin';

const mockUseWallet = jest.fn();
jest.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => mockUseWallet() }));
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: { code: 'B1' } }))
}));

describe('Admin', () => {
  test('denies access for non-admin', () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'other' } });
    render(
      <I18nextProvider i18n={i18n}>
        <Admin />
      </I18nextProvider>
    );
    expect(screen.getByText(/Access denied/i)).toBeTruthy();
  });
});
