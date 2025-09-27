import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import WeyLabs from '../WeyLabs';

const renderLabs = (connected: boolean) =>
  render(
    <I18nextProvider i18n={i18n}>
      <WeyLabs connected={connected} />
    </I18nextProvider>
  );

describe('WeyLabs', () => {
  test('prompts login when user not authenticated', () => {
    renderLabs(false);
    expect(screen.getByText(/Please login to access Wey Labs/i)).toBeTruthy();
  });

  test('shows labs content when authenticated', () => {
    renderLabs(true);
    expect(screen.getByText(/Wey Labs/i)).toBeTruthy();
    expect(screen.getByText(/Trenches/i)).toBeTruthy();
    expect(screen.queryByText(/Meme Wars/i)).toBeNull();
    expect(screen.queryByText(/Eliza AI Trading Bot/i)).toBeNull();
  });
});
