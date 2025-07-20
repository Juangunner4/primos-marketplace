import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import TelegramPanel from '../TelegramPanel';
import * as service from '../../services/telegram';

jest.mock('../../services/telegram');

describe('TelegramPanel', () => {
  test('renders telegram data', async () => {
    (service.fetchTelegramData as jest.Mock).mockResolvedValueOnce([
      { id: '1', message: 'hi', time: '2024-01-01T00:00:00Z' },
    ]);
    render(
      <I18nextProvider i18n={i18n}>
        <TelegramPanel contract="c1" open={true} onClose={() => {}} />
      </I18nextProvider>
    );
    expect(await screen.findByText('hi')).toBeTruthy();
    expect(service.fetchTelegramData).toHaveBeenCalledWith('c1');
  });

  test('calls onClose', async () => {
    (service.fetchTelegramData as jest.Mock).mockResolvedValueOnce([]);
    const onClose = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TelegramPanel contract="c1" open={true} onClose={onClose} />
      </I18nextProvider>
    );
    const btn = await screen.findByLabelText(/close/i);
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
