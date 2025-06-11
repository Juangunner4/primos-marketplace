import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NFTCard, { MarketNFT } from '../NFTCard';

const sampleNFT: MarketNFT = {
  id: '1',
  image: 'img',
  name: 'Primo 1',
  price: 1,
  variant: 'pink',
  rank: 5,
};

describe('NFTCard', () => {
  test('renders nft details when open', () => {
    render(<NFTCard nft={sampleNFT} open={true} onClose={() => {}} />);
    expect(screen.getByText('Primo 1')).toBeTruthy();
    expect(screen.getByText('ID: 1')).toBeTruthy();
    expect(screen.getByText('Rank #5')).toBeTruthy();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<NFTCard nft={sampleNFT} open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
