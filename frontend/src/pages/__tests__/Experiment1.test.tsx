import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Experiment1 from '../Experiment1';

describe('Experiment1 page', () => {
  test('renders upload prompt', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Experiment1 />
        </I18nextProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Experiment #1/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Render 3D/i })).toBeDisabled();
  });
});
