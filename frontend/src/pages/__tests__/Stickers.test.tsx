import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Stickers from '../Stickers';

jest.mock('../utils/helius', () => ({
  fetchCollectionNFTsForOwner: jest.fn(() => Promise.resolve([]))
}));

describe('Stickers page', () => {
  test('renders order button disabled', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Stickers />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Experiment #2/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Order Sticker/i })).toBeDisabled();
  });
});
