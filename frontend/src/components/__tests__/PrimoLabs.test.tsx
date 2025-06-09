import React from 'react';
import { render, screen } from '@testing-library/react';
import PrimoLabs from '../PrimoLabs';

const renderLabs = (connected: boolean) => render(<PrimoLabs connected={connected} />);

describe('PrimoLabs', () => {
  test('prompts login when user not authenticated', () => {
    renderLabs(false);
    expect(screen.getByText(/Please login to access Primo Labs/i)).toBeTruthy();
  });

  test('shows labs content when authenticated', () => {
    renderLabs(true);
    expect(screen.getByText(/Primo Labs/i)).toBeTruthy();
    expect(screen.getByText(/Our Primos NFTs/i)).toBeTruthy();
    expect(screen.getByText(/DeFAI/i)).toBeTruthy();
  });
});
