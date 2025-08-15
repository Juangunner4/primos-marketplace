import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Merch from '../Merch';

describe('Merch', () => {
  test('renders merch items', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Merch />
      </I18nextProvider>
    );
    expect(screen.getByText(/Merch/i)).toBeTruthy();
    expect(screen.getAllByText('Buy Now').length).toBe(4);
  });
});
