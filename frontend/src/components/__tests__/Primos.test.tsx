import React from 'react';
import { render, screen } from '@testing-library/react';
import Primos from '../Primos';

const renderPrimos = (connected: boolean) => render(<Primos connected={connected} />);

describe('Primos component', () => {
  test('prompts login when not authenticated', () => {
    renderPrimos(false);
    expect(screen.getByText(/Please login to access Primos/i)).toBeTruthy();
  });

  test('shows members title when authenticated', () => {
    renderPrimos(true);
    expect(screen.getByText(/Primos/i)).toBeTruthy();
  });
});
