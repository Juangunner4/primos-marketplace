import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { PrimoHolderProvider, usePrimoHolder } from '../PrimoHolderContext';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));


jest.mock('axios');

const mockUseWallet = useWallet as jest.Mock;
const mockAxiosGet = (axios.get as unknown) as jest.Mock;
const mockAxiosPost = (axios.post as unknown) as jest.Mock;

describe('PrimoHolderContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosPost.mockResolvedValue({});
  });

  test('returns false when wallet not connected', () => {
    mockUseWallet.mockReturnValue({ publicKey: null });
    const { result } = renderHook(() => usePrimoHolder(), {
      wrapper: ({ children }) => <PrimoHolderProvider>{children}</PrimoHolderProvider>,
    });
    expect(result.current.isHolder).toBe(false);
  });

  test('returns true when NFTs found', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'abc' } });
    mockAxiosGet.mockResolvedValue({ data: { abc: 1 } });
    const { result } = renderHook(() => usePrimoHolder(), {
      wrapper: ({ children }) => <PrimoHolderProvider>{children}</PrimoHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(true));
  });

  test('handles fetch error gracefully', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'abc' } });
    mockAxiosGet.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePrimoHolder(), {
      wrapper: ({ children }) => <PrimoHolderProvider>{children}</PrimoHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(false));
  });
});
