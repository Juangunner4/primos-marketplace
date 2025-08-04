import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserProfile from '../UserProfile';
import i18n from '../../i18n';
import api from '../../utils/api';

const mockUseWallet = jest.fn();
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockUseWallet()
}));

jest.mock('../../utils/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: {
    publicKey: 'pubkey123',
    bio: '',
    socials: { twitter: '', discord: '', website: '' },
    pfp: '',
    domain: 'my.sol',
    points: 0,
    pointsToday: 0,
    pointsDate: 'today',
    pesos: 0
  }})),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {
    publicKey: 'pubkey123',
    bio: '',
    socials: { twitter: '', discord: '', website: '' },
    pfp: '',
    domain: 'my.sol',
    points: 1,
    pointsToday: 1,
    pointsDate: 'today',
    pesos: 0
  }}))
}));

jest.mock('../../utils/sns', () => ({
  getPrimaryDomainName: jest.fn(() => Promise.resolve('my.sol')),
  verifyDomainOwnership: jest.fn(),
}));

jest.mock('../../services/helius', () => ({
  getAssetsByCollection: jest.fn(() => Promise.resolve([{ id: 't1', image: 'i', name: 'n', listed: false }])),
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

  test('shows domain next to wallet', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    const walletText = await screen.findByText(/Wallet/i);
    expect(walletText.textContent).toContain('my.sol');
  });

  test('shows SNS badge when domain present', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    expect(await screen.findByLabelText('sns-badge')).toBeTruthy();
  });

  test('renders twitter and website links', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    const { get } = require('../../utils/api');
    (get as jest.Mock).mockResolvedValueOnce({
      data: {
        publicKey: 'pubkey123',
        bio: '',
        socials: { twitter: 'mytwitter', discord: '', website: 'https://example.com' },
        pfp: '',
        domain: 'my.sol',
        points: 0,
        pointsToday: 0,
        pointsDate: 'today',
        pesos: 0,
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    await screen.findByText(/Wallet/i);

    const twitterLink = screen.getByRole('link', { name: 'mytwitter' });
    expect(twitterLink.getAttribute('href')).toBe('https://x.com/mytwitter');

    const websiteLink = screen.getByRole('link', { name: 'https://example.com' });
    expect(websiteLink.getAttribute('href')).toBe('https://example.com');
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

  test('earns point when clicking button', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    const { findByText } = render(
      <I18nextProvider i18n={i18n}>
        <UserProfile />
      </I18nextProvider>
    );

    await findByText(/Wallet/i);
    fireEvent.click(screen.getByText(/Earn Point/i));
    await waitFor(() => expect((api.post as jest.Mock).mock.calls.length).toBe(1));
    expect(await screen.findByText(/Points: 1/i)).toBeTruthy();
  });

  test('shows owned NFTs for public view', async () => {
    mockUseWallet.mockReturnValue({ publicKey: null });
    render(
      <MemoryRouter initialEntries={['/user/pub']}>
        <Routes><Route path="/user/:publicKey" element={<I18nextProvider i18n={i18n}><UserProfile /></I18nextProvider>} /></Routes>
      </MemoryRouter>
    );

    const img = await screen.findByRole('img');
    expect(img).toBeTruthy();
  });

  test('likes NFT when button clicked', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pubkey123' } });
    const { get } = require('../../utils/api');
    const { post } = require('../../utils/api');
    (get as jest.Mock).mockResolvedValueOnce({ data: { publicKey: 'pubkey123', bio: '', socials: { twitter: '', discord: '', website: '' }, pfp: '', domain: 'my.sol', points:0, pointsToday:0, pointsDate:'today', pesos:0 } });
    (post as jest.Mock).mockResolvedValue({ data: { count: 1, liked: true } });
    render(<I18nextProvider i18n={i18n}><UserProfile /></I18nextProvider>);
    const btn = await screen.findByLabelText('like');
    fireEvent.click(btn);
    await waitFor(() => expect(post).toHaveBeenCalled());
  });
});
