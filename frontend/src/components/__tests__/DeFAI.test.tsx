import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import DeFAI from '../DeFAI';

describe('DeFAI', () => {
  test('renders and sends message', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DeFAI />
      </I18nextProvider>
    );

    expect(screen.getByText(i18n.t('defai_title'))).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(i18n.t('defai_placeholder')), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByText(i18n.t('defai_send')));
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
