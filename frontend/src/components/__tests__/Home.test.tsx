import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import Home from '../Home';
import i18n from '../../i18n';

jest.mock('axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('../../utils/magiceden', () => ({
  getMagicEdenStats: jest.fn(() => Promise.resolve({ listedCount: 1, volume24hr: 2, floorPrice: 3 })),
  getMagicEdenHolderStats: jest.fn(() => Promise.resolve({ uniqueHolders: 1, totalSupply: 2 })),
}));
jest.mock('../../utils/pyth', () => ({ getPythSolPrice: jest.fn(() => Promise.resolve(1)) }));

jest.mock('@mui/material/Button', () => (props: any) => <button {...props} />);

describe('Home', () => {
  test('renders hero heading', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Home />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Welcome/)).toBeTruthy();
  });

  test('hides join button when logged in', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Home connected={true} />
      </I18nextProvider>
    );
    expect(screen.queryByText(/Join Primos/i)).toBeNull();
  });
});
