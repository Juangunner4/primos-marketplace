import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import SidebarNav from '../SidebarNav';
import i18n from '../../i18n';

jest.mock('@mui/material/useMediaQuery', () => () => true);

describe('SidebarNav', () => {
  test('renders mobile navigation button', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <SidebarNav />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/open navigation/i)).toBeTruthy();
  });
});
