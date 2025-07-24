import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Work from '../Work';

const mockUseWallet = jest.fn();
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockUseWallet()
}));

jest.mock('../../utils/api', () => ({
  get: jest.fn((url: string) => {
    if (url.startsWith('/api/user/')) {
      return Promise.resolve({ data: { workGroups: ['art'] } });
    }
    return Promise.resolve({ data: [] });
  }),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}));

describe('Work page', () => {
  test('renders title and submits request', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'pk' } });
    render(
      <MemoryRouter>
        <Work />
      </MemoryRouter>
    );
    expect(screen.getByText(/Work Requests/i)).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText(/Submit/i));
    expect(await screen.findByRole('textbox')).toHaveValue('');
  });
});
