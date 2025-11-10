import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import PrimosMarketGallery from '../PrimosMarketGallery';
import i18n from '../../i18n';
import * as magiceden from '../../utils/magiceden';

jest.mock('../../components/Activity', () => () => <div />);

jest.mock('../../utils/magiceden', () => ({
  fetchMagicEdenListings: jest.fn(() => Promise.resolve([])),
  getMagicEdenStats: jest.fn(() => Promise.resolve(null)),
  getMagicEdenHolderStats: jest.fn(() => Promise.resolve(null)),
  getCollectionAttributes: jest.fn(() => Promise.resolve({ attributes: {} }))
}));

jest.mock('../../utils/transaction', () => ({
  executeBuyNow: jest.fn(),
}));

jest.mock('../../services/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../utils/pyth', () => ({
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
    (require('../../services/helius').getNFTByTokenAddress as jest.Mock).mockResolvedValueOnce({
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

  test('filters nfts by min price', async () => {
    (magiceden.fetchMagicEdenListings as jest.Mock).mockResolvedValueOnce([
      { tokenMint: 'mint1', price: 1, rarityRank: 1, img: 'img1', name: 'Primo1' },
      { tokenMint: 'mint2', price: 5, rarityRank: 2, img: 'img2', name: 'Primo2' },
    ]);
    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByLabelText(/Open Filters/i));
    fireEvent.change(screen.getAllByLabelText('Min')[0], { target: { value: '2' } });
    fireEvent.click(screen.getByText('Apply'));
    expect(await screen.findByText('Primo2')).toBeTruthy();
    expect(screen.queryByText('Primo1')).toBeNull();
  });

  test('loads next page of listings when clicking next', async () => {
    (magiceden.getMagicEdenStats as jest.Mock).mockResolvedValue({ listedCount: 20, floorPrice: null });
    (magiceden.fetchMagicEdenListings as jest.Mock)
      .mockResolvedValueOnce([
        { tokenMint: 'mint1', price: 1, rarityRank: 1, img: 'img1', name: 'Primo1' },
      ])
      .mockResolvedValueOnce([
        { tokenMint: 'mint2', price: 2, rarityRank: 2, img: 'img2', name: 'Primo2' },
      ]);

    render(
      <I18nextProvider i18n={i18n}>
        <PrimosMarketGallery />
      </I18nextProvider>
    );

    expect(await screen.findByText('Primo1')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('Primo2')).toBeTruthy();
    expect(screen.queryByText('Primo1')).toBeNull();
    expect((magiceden.fetchMagicEdenListings as jest.Mock).mock.calls[1][1]).toBe(10);
  });
});
