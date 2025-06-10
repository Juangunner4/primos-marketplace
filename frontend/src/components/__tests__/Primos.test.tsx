import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Primos from '../../pages/Primos';

jest.mock('axios', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: [
        { publicKey: 'abcdef123456', pfp: '', points: 1, pesos: 2 },
      ],
    })
  ),
}));

jest.mock('../services/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null)),
  fetchCollectionNFTsForOwner: jest.fn(() => Promise.resolve([])),
}));

const renderPrimos = (connected: boolean) =>
  render(
    <MemoryRouter>
      <Primos connected={connected} />
    </MemoryRouter>
  );

describe('Primos component', () => {
  test('prompts login when not authenticated', () => {
    renderPrimos(false);
    expect(screen.getByText(/Please login to access Primos/i)).toBeTruthy();
  });

  test('shows members title when authenticated', () => {
    renderPrimos(true);
    expect(screen.getByText(/Primos/i)).toBeTruthy();
  });

  test('links each member to profile page', async () => {
    renderPrimos(true);
    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/user/abcdef123456');
  });

  test('displays pesos pill', async () => {
    renderPrimos(true);
    const pill = await screen.findByText(/Pesos: 2/i);
    expect(pill).toBeTruthy();
  });
});
