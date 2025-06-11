import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrimosMarketGallery from '../PrimosMarketGallery';

jest.mock('../../api/nfts', () => ({
  fetchNfts: jest.fn(() => Promise.resolve({ items: [], availableTraits: {} }))
}));

describe('PrimosMarketGallery', () => {
  test('shows loading state', async () => {
    render(<PrimosMarketGallery />);
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  test('updates search query', async () => {
    render(<PrimosMarketGallery />);
    fireEvent.change(screen.getByPlaceholderText('Search NFTs…'), { target: { value: 'test' } });
    expect(screen.getByDisplayValue('test')).toBeTruthy();
  });
});
