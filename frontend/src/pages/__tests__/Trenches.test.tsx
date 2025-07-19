import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Trenches from '../Trenches';

jest.mock('../utils/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: { contracts: [], users: [] } })),
  post: jest.fn(() => Promise.resolve()),
}));

jest.mock('../utils/helius', () => ({
  getNFTByTokenAddress: jest.fn(() => Promise.resolve(null)),
  fetchCollectionNFTsForOwner: jest.fn(() => Promise.resolve([])),
}));

describe('Trenches page', () => {
  test('renders add button disabled', async () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Trenches />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Trenches/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add Contract/i })).toBeDisabled();
  });
});
