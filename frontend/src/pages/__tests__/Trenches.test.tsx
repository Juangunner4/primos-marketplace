import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Trenches from '../Trenches';
import * as trenchService from '../../services/trench';
import * as tokenService from '../../services/token';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
  useConnection: () => ({ connection: {} }),
}));

jest.mock('../../contexts/PrimoHolderContext', () => ({
  usePrimoHolder: () => ({ isHolder: false }),
}));

jest.mock('../../services/trench', () => ({
  fetchTrenchData: jest.fn(() =>
    Promise.resolve({
      contracts: [{ contract: 'c1', count: 1, firstCaller: 'u1' }],
      users: [
        {
          publicKey: 'u1',
          pfp: '',
          count: 1,
          contracts: ['c1'],
          lastSubmittedAt: 1,
        },
      ],
    })
  ),
  submitTrenchContract: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/token', () => ({
  fetchTokenMetadata: jest.fn(() => Promise.resolve({})),
  fetchTokenInfo: jest.fn(() => Promise.resolve(null)),
}));

describe('Trenches page', () => {
  test('renders without add button for guests', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Trenches/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Add Contract/i })).toBeNull();
  });

  test('displays contract bubble and opens panel', async () => {
    (trenchService.fetchTrenchData as jest.Mock).mockResolvedValueOnce({
      contracts: [{ contract: 'c1', count: 1, firstCaller: 'u1' }],
      users: [
        {
          publicKey: 'u1',
          pfp: '',
          count: 1,
          contracts: ['c1'],
          lastSubmittedAt: 1,
        },
      ],
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );

    const bubble = await screen.findByLabelText('c1');
    bubble.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await waitFor(() =>
      expect(tokenService.fetchTokenMetadata).toHaveBeenCalledWith('c1')
    );
    expect(await screen.findByText(/Token Metadata/i)).toBeTruthy();
  });
});

