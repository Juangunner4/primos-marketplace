import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import TokenPanel from '../TokenPanel';
import * as service from '../../services/token';

jest.mock('../../services/token');

describe('TokenPanel', () => {
  test('renders token metadata', async () => {
    (service.fetchTokenMetadata as jest.Mock).mockResolvedValueOnce({
      name: 'cat',
      symbol: 'CAT',
      description: 'desc',
      image: 'img',
    });
    render(
      <I18nextProvider i18n={i18n}>
        <TokenPanel contract="c1" open={true} onClose={() => {}} />
      </I18nextProvider>
    );
    expect(await screen.findByText('cat')).toBeTruthy();
    expect(service.fetchTokenMetadata).toHaveBeenCalledWith('c1');
  });

  test('calls onClose', async () => {
    (service.fetchTokenMetadata as jest.Mock).mockResolvedValueOnce({});
    const onClose = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TokenPanel contract="c1" open={true} onClose={onClose} />
      </I18nextProvider>
    );
    const btn = await screen.findByLabelText(/close/i);
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
