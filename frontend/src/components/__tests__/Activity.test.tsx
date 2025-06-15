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
});
