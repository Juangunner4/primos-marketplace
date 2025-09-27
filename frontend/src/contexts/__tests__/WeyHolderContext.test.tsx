import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { WeyHolderProvider, useWeyHolder } from '../WeyHolderContext';
import { useWallet } from '@solana/wallet-adapter-react';
import api from '../../utils/api';
import { checkWeyHolder } from '../../utils/helius';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));


jest.mock('../../utils/api');
jest.mock('../../utils/helius');

const mockUseWallet = useWallet as jest.Mock;
const mockApiGet = (api.get as unknown) as jest.Mock;
const mockApiPost = (api.post as unknown) as jest.Mock;
const mockCheckWeyHolder = (checkWeyHolder as unknown) as jest.Mock;

describe('WeyHolderContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiPost.mockResolvedValue({});
    mockCheckWeyHolder.mockResolvedValue(false);
  });

  test('returns false when wallet not connected', () => {
    mockUseWallet.mockReturnValue({ publicKey: null });
    const { result } = renderHook(() => useWeyHolder(), {
      wrapper: ({ children }) => <WeyHolderProvider>{children}</WeyHolderProvider>,
    });
    expect(result.current.isHolder).toBe(false);
  });

  test('returns true when NFTs found', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'abc' } });
    mockCheckWeyHolder.mockResolvedValue(true);
    mockApiGet.mockResolvedValue({ data: { publicKey: 'abc', betaRedeemed: false } });
    const { result } = renderHook(() => useWeyHolder(), {
      wrapper: ({ children }) => <WeyHolderProvider>{children}</WeyHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(true));
  });

  test('handles fetch error gracefully', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'abc' } });
    mockCheckWeyHolder.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useWeyHolder(), {
      wrapper: ({ children }) => <WeyHolderProvider>{children}</WeyHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(false));
  });
});
