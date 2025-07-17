import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import PrimoLabs from '../PrimoLabs';

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
    expect(screen.getByText(/Experiment #1/i)).toBeTruthy();
    expect(screen.getByText(/Experiment #2/i)).toBeTruthy();
    expect(screen.queryByText(/Meme Wars/i)).toBeNull();
    expect(screen.queryByText(/Eliza AI Trading Bot/i)).toBeNull();
  });
});
