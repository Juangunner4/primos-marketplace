import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import PrimosMarketGallery from '../../pages/PrimosMarketGallery';
import i18n from '../../i18n';
import * as magiceden from '../utils/magiceden';

jest.mock('../Activity', () => () => <div />);

jest.mock('../utils/magiceden', () => ({
  fetchMagicEdenListings: jest.fn(() => Promise.resolve([])),
  getMagicEdenStats: jest.fn(() => Promise.resolve(null)),
  getMagicEdenHolderStats: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../services/helius', () => ({
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

  test('renders pagination input', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );
    expect(screen.getByRole('spinbutton')).toBeTruthy();
  });

  test('shows rarity rank when listings are loaded', async () => {
    (magiceden.fetchMagicEdenListings as jest.Mock).mockResolvedValueOnce([
      {
        tokenMint: 'mint1',
        price: 1,
        rarityRank: 10,
      },
    ]);
    (require('../services/helius').getNFTByTokenAddress as jest.Mock).mockResolvedValueOnce({
      image: 'img',
      name: 'Primo #1',
    });
    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Rank/)).toBeTruthy();
  });

  test('renders buy button for each nft', async () => {
    (magiceden.fetchMagicEdenListings as jest.Mock).mockResolvedValueOnce([
      { tokenMint: 'mint1', price: 1, rarityRank: 1, img: 'img', name: 'Primo' },
    ]);
    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );
    expect(await screen.findByText('Buy Now')).toBeTruthy();
  });
});
