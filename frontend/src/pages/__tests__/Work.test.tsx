import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Work from '../Work';

jest.mock('../../utils/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}));

describe('Work page', () => {
  test('renders title and submits request', async () => {
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
