import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import BetaRedeem from '../components/BetaRedeem';
import '@testing-library/jest-dom';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: { toBase58: () => 'test-wallet' } })
}));

jest.mock('../contexts/WeyHolderContext', () => ({
  useWeyHolder: () => ({
    betaRedeemed: false,
    userExists: false,
    showRedeemDialog: false,
    setShowRedeemDialog: jest.fn(),
    redeemBetaCode: jest.fn().mockResolvedValue(undefined),
    isHolder: true
  })
}));

describe('BetaRedeem', () => {
  test('shows OK action after redeem', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BetaRedeem autoOpen />
      </I18nextProvider>
    );

    fireEvent.change(screen.getByRole('textbox', { name: /Enter Beta Code/i }), {
      target: { value: 'BETA-12345678' }
    });
    fireEvent.click(screen.getByText(/Redeem Beta Code/i));

    await waitFor(() => expect(screen.getByText('OK')).toBeInTheDocument());
  });
});
