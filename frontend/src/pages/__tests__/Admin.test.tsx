import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Admin from '../Admin';

const mockUseWallet = jest.fn();
jest.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => mockUseWallet() }));
jest.mock('../../utils/api', () => ({
  get: jest.fn((url: string) => {
    if (url.includes('/stats')) {
      return Promise.resolve({ data: { totalWallets: 1, totalPoints: 2, weyHolders: 1, betaCodes: 1, betaCodesRedeemed: 0, weysHeld: 1, walletsWithWeys: 1, dbMarketCap: 1, floorPrice: 1 } });
    }
    if (url.includes('/api/user/weys')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [{ code: 'BETA1', redeemed: false }] });
  }),
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

  test('shows active beta codes for admin', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6' } });
    render(
      <I18nextProvider i18n={i18n}>
        <Admin />
      </I18nextProvider>
    );
    expect(await screen.findByText('BETA1')).toBeTruthy();
  });
});
