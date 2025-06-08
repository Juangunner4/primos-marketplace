import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserProfile from '../UserProfile';
import i18n from '../../i18n';

const mockUseWallet = jest.fn();
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockUseWallet()
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {
    publicKey: 'pubkey123',
    bio: '',
    socials: { twitter: '', discord: '', website: '' },
    pfp: '',
    points: 0,
    pesos: 0
  }})),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}));

jest.mock('../utils/helius', () => ({
  getAssetsByCollection: jest.fn(() => Promise.resolve([])),
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null))
}));

describe('UserProfile', () => {
  test('returns null when wallet not connected', () => {
    mockUseWallet.mockReturnValue({ publicKey: null });
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  test('shows cancel button and NFT selector when entering edit mode', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    await screen.findByText(/Wallet/i);

    expect(screen.queryByText(/Select NFT as PFP/i)).toBeNull();

    fireEvent.click(screen.getByText(/Edit/i));

    fireEvent.click(await screen.findByText(/Yes, Edit/i));

    await waitFor(() => {
      expect(screen.getByText(/Cancel/i)).toBeTruthy();
      expect(screen.getByText(/Select NFT as PFP/i)).toBeTruthy();
    });
  });

  test('hides NFT selector after saving profile', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    await screen.findByText(/Wallet/i);

    fireEvent.click(screen.getByText(/Edit/i));
    fireEvent.click(await screen.findByText(/Yes, Edit/i));

    fireEvent.click(await screen.findByText(/Select NFT as PFP/i));

    expect(container.querySelector('.profile-nft-grid')).toBeTruthy();

    fireEvent.click(screen.getByText(/Save/i));
    fireEvent.click(await screen.findByText(/Yes, Save/i));

    await waitFor(() => {
      expect(screen.queryByText(/Select NFT as PFP/i)).toBeNull();
    });

    expect(container.querySelector('.profile-nft-grid')).toBeNull();
  });

  test('does not allow editing another user profile', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'wallet123' } });
    render(
      <MemoryRouter initialEntries={['/user/other123']}>
        <Routes>
          <Route path="/user/:publicKey" element={<I18nextProvider i18n={i18n}><UserProfile /></I18nextProvider>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/Wallet/i);
    expect(screen.queryByText(/Edit/i)).toBeNull();
  });
});
