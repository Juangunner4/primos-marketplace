import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import PrimosMarketGallery from '../PrimosMarketGallery';
import i18n from '../../i18n';

jest.mock('../Activity', () => () => <div />);

jest.mock('../utils/magiceden', () => ({
  fetchMagicEdenListings: jest.fn(() => Promise.resolve([])),
  getMagicEdenStats: jest.fn(() => Promise.resolve(null)),
  getMagicEdenHolderStats: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../utils/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../utils/pyth', () => ({
  getPythSolPrice: jest.fn(() => Promise.resolve(null))
}));

describe('PrimosMarketGallery', () => {
  test('shows loading spinner initially', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );
    expect(screen.getByText(/Loading NFTs/i)).toBeTruthy();
  });
});
