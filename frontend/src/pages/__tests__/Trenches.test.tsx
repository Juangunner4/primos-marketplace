import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Trenches from '../Trenches';
import * as trenchService from '../../services/trench';
import * as telegramService from '../../services/telegram';
import * as tokenService from '../../services/token';

jest.mock('../../services/trench', () => ({
  fetchTrenchData: jest.fn(() =>
    Promise.resolve({
      contracts: [{ contract: 'c1', count: 1 }],
      users: [{ publicKey: 'u1', pfp: '', count: 1, contracts: ['c1'] }],
    })
  ),
  submitTrenchContract: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../services/telegram', () => ({
  fetchTelegramData: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../services/token', () => ({
  fetchTokenMetadata: jest.fn(() => Promise.resolve({})),
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
    expect(screen.getByText(/Trenches/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add Contract/i })).toBeDisabled();
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

    expect(await screen.findByText('c1')).toBeTruthy();
  });

  test('opens telegram panel on bubble click', async () => {
    (trenchService.fetchTrenchData as jest.Mock).mockResolvedValueOnce({
      contracts: [{ contract: 'c1', count: 1 }],
      users: [{ publicKey: 'u1', pfp: '', count: 1, contracts: ['c1'] }],
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
    const bubble = await screen.findByText('c1');
    bubble.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(telegramService.fetchTelegramData).toHaveBeenCalledWith('c1');
    expect(tokenService.fetchTokenMetadata).toHaveBeenCalledWith('c1');
    expect(await screen.findByText(/Telegram Data/i)).toBeTruthy();
  });
});
