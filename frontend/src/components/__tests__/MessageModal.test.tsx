import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import MessageModal from '../MessageModal';
import { AppMessage } from '../../types';

describe('MessageModal', () => {
  const message: AppMessage = { text: 'Hello' };
  test('renders message text', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MessageModal open={true} message={message} onClose={() => {}} />
      </I18nextProvider>
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  test('calls onClose', () => {
    const onClose = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <MessageModal open={true} message={message} onClose={onClose} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
