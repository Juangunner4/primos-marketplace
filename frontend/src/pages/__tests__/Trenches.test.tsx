import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Trenches from '../Trenches';
import * as trenchService from '../../services/trench';
import * as tokenService from '../../services/token';
import api from '../../utils/api';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: null }),
  useConnection: () => ({ connection: {} }),
}));

jest.mock('../../services/trench', () => ({
  fetchTrenchData: jest.fn(() =>
    Promise.resolve({
      contracts: [{ contract: 'c1', count: 1 }],
      users: [{ publicKey: 'u1', pfp: '', count: 1, contracts: ['c1'] }],
    })
  ),
  submitTrenchContract: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../services/token', () => ({
  fetchTokenMetadata: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('Trenches page', () => {
  test('renders add button disabled', async () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Trenches/i })).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /Add Contract/i }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(screen.getByRole('button', { name: /My Contracts/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /All Contracts/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Scanner/i })).toBeTruthy();
  });

  test('shows message when no contracts', async () => {
    (trenchService.fetchTrenchData as jest.Mock).mockResolvedValueOnce({
      contracts: [],
      users: [],
    });
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText(/not scanned/i)).toBeTruthy();
  });

  test('displays shared contracts bubble map', async () => {
    (trenchService.fetchTrenchData as jest.Mock).mockResolvedValueOnce({
      contracts: [{ contract: 'c1', count: 2 }],
      users: [
        { publicKey: 'u1', pfp: '', count: 1, contracts: ['c1'] },
        { publicKey: 'u2', pfp: '', count: 1, contracts: ['c1'] },
      ],
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );

    // Switch to All Contracts tab
    const allContractsButton = screen.getByRole('button', { name: /All Contracts/i });
    allContractsButton.click();

    expect(await screen.findByLabelText('c1')).toBeTruthy();
  });

  test('opens telegram panel on bubble click', async () => {
    (trenchService.fetchTrenchData as jest.Mock).mockResolvedValueOnce({
      contracts: [{ contract: 'c1', count: 2 }],
      users: [
        { publicKey: 'u1', pfp: '', count: 1, contracts: ['c1'] },
        { publicKey: 'u2', pfp: '', count: 1, contracts: ['c1'] },
      ],
    });
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );
    const allBtn = screen.getByRole('button', { name: /All Contracts/i });
    allBtn.click();
    const bubble = await screen.findByLabelText('c1');
    bubble.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await waitFor(() =>
      expect(tokenService.fetchTokenMetadata).toHaveBeenCalledWith('c1')
    );
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/api/telegram/c1')
    );
    expect(await screen.findByText(/Telegram Data/i)).toBeTruthy();
  });
});
