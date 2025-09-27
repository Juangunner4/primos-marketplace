import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Docs from '../Docs';

describe('Docs', () => {
  test('renders docs heading and image', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Docs />
      </I18nextProvider>
    );
    expect(screen.getByText(/Docs/i)).toBeTruthy();
    expect(screen.getByAltText(/Weys Community Visual/i)).toBeTruthy();
    expect(screen.getByText(/Overview/i)).toBeTruthy();
    expect(screen.getByText(i18n.t('wey_labs_floating_body'))).toBeTruthy();
  });
});
