import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import Activity from '../Activity';
import i18n from '../../i18n';

jest.mock('../utils/magiceden', () => ({
  fetchMagicEdenActivity: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../services/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../utils/pyth', () => ({
  getPythSolPrice: jest.fn(() => Promise.resolve(null))
}));

jest.mock('@mui/material/useMediaQuery', () => () => true);

describe('Activity component', () => {
  test('renders activity panel title', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Activity />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Activity/i)).toBeTruthy();
  });

  test('opens NFTCard on image click', async () => {
    const { fetchMagicEdenActivity } = require('../utils/magiceden');
    const { getNFTByTokenAddress } = require('../services/helius');
    (fetchMagicEdenActivity as jest.Mock).mockResolvedValueOnce([
      {
        tokenMint: 'mint1',
        type: 'sale',
        price: 1,
        blockTime: 1,
        signature: 'sig1',
      },
    ]);
    (getNFTByTokenAddress as jest.Mock).mockResolvedValueOnce({
      id: 'mint1',
      image: 'img',
      name: 'Primo 1',
    });
    render(
      <I18nextProvider i18n={i18n}>
        <Activity />
      </I18nextProvider>
    );
    const img = await screen.findByAltText('Primo 1');
    fireEvent.click(img);
    await waitFor(() => {
      expect(screen.getByText('Primo 1')).toBeTruthy();
    });
  });

  test('displays activity time', async () => {
    const { fetchMagicEdenActivity } = require('../utils/magiceden');
    (fetchMagicEdenActivity as jest.Mock).mockResolvedValueOnce([
      {
        tokenMint: 'mint2',
        type: 'sale',
        price: 1,
        blockTime: 1,
        signature: 'sig2',
      },
    ]);
    render(
      <I18nextProvider i18n={i18n}>
        <Activity />
      </I18nextProvider>
    );
    const timeString = new Date(1000).toLocaleString();
    expect(await screen.findByText(timeString)).toBeTruthy();
  });

  test('closes panel when close button clicked', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Activity />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByLabelText(/open activity/i));
    const closeBtn = await screen.findByLabelText(/close activity/i);
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByLabelText(/close activity/i)).toBeNull();
    });
  });

  test('toggles panel with action icon', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Activity />
      </I18nextProvider>
    );
    const toggleBtn = screen.getByLabelText(/open activity/i);
    fireEvent.click(toggleBtn);
    expect(await screen.findByLabelText(/close activity/i)).toBeTruthy();
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(screen.queryByLabelText(/close activity/i)).toBeNull();
    });
  });
});
