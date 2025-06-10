import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
