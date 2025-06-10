import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import PrimoLabs from '../../pages/PrimoLabs';

const renderLabs = (connected: boolean) =>
  render(
    <I18nextProvider i18n={i18n}>
      <PrimoLabs connected={connected} />
    </I18nextProvider>
  );

describe('PrimoLabs', () => {
  test('prompts login when user not authenticated', () => {
    renderLabs(false);
    expect(screen.getByText(/Please login to access Primo Labs/i)).toBeTruthy();
  });

  test('shows labs content when authenticated', () => {
    renderLabs(true);
    expect(screen.getByText(/Primo Labs/i)).toBeTruthy();
    expect(screen.getByText(/Our Primos NFTs/i)).toBeTruthy();
    expect(screen.getByText(/DeFi/i)).toBeTruthy();
    expect(screen.getByText(/MemeFi/i)).toBeTruthy();
    expect(screen.getByText(/Coming Soon/i)).toBeTruthy();
});
