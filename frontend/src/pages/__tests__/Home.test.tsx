/// <reference types="jest" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { I18nextProvider } from 'react-i18next';
import Home from '../Home';
import i18n from '../../i18n';

// Mock modules
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: () => Promise.resolve(),
      post: () => Promise.resolve(),
    }),
  },
}));
jest.mock('../../utils/api');
jest.mock('../../utils/helius');
jest.mock('../../services/coingecko');

jest.mock('@mui/material/Button', () => (props: any) => <button {...props} />);

describe('Home', () => {
  test('renders hero heading', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Home />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Join Weys/i)).toBeTruthy();
  });

  test('hides join button when logged in', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Home connected={true} />
      </I18nextProvider>
    );
    expect(screen.queryByText(/Join Weys/i)).toBeNull();
  });

  test('renders latest trenches contract bubbles up to 8', async () => {
    const testContracts = Array.from({ length: 12 }, (_, i) => ({ contract: `0xaddr${i}`, image: '' }));
    // Override api.get mock for /api/trench endpoint
    (require('../../utils/api').default.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/trench') {
        return Promise.resolve({ data: { contracts: testContracts } });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <I18nextProvider i18n={i18n}>
        <Home />
      </I18nextProvider>
    );

    // Wait for latest trenches heading
    await screen.findByText(/Latest Trenches Contracts/);

    // Check contract bubbles (title attribute)
    const bubbles = await screen.findAllByTitle(/0xaddr/);
    expect(bubbles).toHaveLength(8);
    // newest first: 11 down to 4
    expect(bubbles[0].getAttribute('title')).toBe('0xaddr11');
    expect(bubbles[7].getAttribute('title')).toBe('0xaddr4');
  });

  test('renders market cap tags on contract bubbles when available', async () => {
    const testContracts = [
      { contract: '0xaddr1', image: '', marketCap: 1500000, priceChange24h: 5.2 },
      { contract: '0xaddr2', image: '', marketCap: 2500000000, priceChange24h: -2.1 },
      { contract: '0xaddr3', image: '' }
    ];
    
    (require('../../utils/api').default.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/trench') {
        return Promise.resolve({ data: { contracts: testContracts } });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <I18nextProvider i18n={i18n}>
        <Home />
      </I18nextProvider>
    );

    // Wait for contract bubbles to render
    await waitFor(() => {
      expect(screen.getAllByTitle(/0xaddr/)).toHaveLength(3);
    });

    // Check for market cap tags
    expect(screen.getByText('$1.5M')).toBeTruthy();
    expect(screen.getByText('$2.5B')).toBeTruthy();

    // Check for price change tags
    expect(screen.getByText('+5.2%')).toBeTruthy();
    expect(screen.getByText('-2.1%')).toBeTruthy();
  });
});
