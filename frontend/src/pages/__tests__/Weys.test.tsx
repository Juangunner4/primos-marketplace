import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Weys from '../Weys';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
}));

jest.mock('../../utils/api', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: [
        { publicKey: 'abcdef123456', pfp: '', points: 1, pesos: 2, domain: 'cool.sol' },
      ],
    })
  ),
}));

jest.mock('../../services/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null)),
  fetchCollectionNFTsForOwner: jest.fn(() => Promise.resolve([])),
}));

const renderWeys = () =>
  render(
    <MemoryRouter>
      <Weys />
    </MemoryRouter>
  );

describe('Weys component', () => {
  test('shows members title', () => {
    renderWeys();
    expect(screen.getByText(/Weys/i)).toBeTruthy();
  });

  test('links each member to profile page', async () => {
    renderWeys();
    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/user/abcdef123456');
  });

  test('displays pesos pill', async () => {
    renderWeys();
    const pill = await screen.findByText(/Pesos: 2/i);
    expect(pill).toBeTruthy();
  });

  test('filters by domain name', async () => {
    renderWeys();
    const input = screen.getByPlaceholderText(/domain/i);
    screen.getByText(/cool.sol/); // ensure member rendered with domain
    expect(screen.getByText(/cool.sol/)).toBeTruthy();
    // filter for unmatched domain
    input.focus();
    input.setSelectionRange(0,0);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.queryByText(/cool.sol/)).toBeNull();
  });
});
