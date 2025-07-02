import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { PrimoHolderProvider, usePrimoHolder } from '../PrimoHolderContext';
import { usePrivyWallet } from '../../hooks/usePrivyWallet';
import api from '../../utils/api';
import { checkPrimoHolder } from '../../utils/helius';

jest.mock('../../hooks/usePrivyWallet', () => ({
  usePrivyWallet: jest.fn(),
}));


jest.mock('../../utils/api');
jest.mock('../../utils/helius');

const mockUseWallet = usePrivyWallet as jest.Mock;
const mockApiGet = (api.get as unknown) as jest.Mock;
const mockApiPost = (api.post as unknown) as jest.Mock;
const mockCheckPrimoHolder = (checkPrimoHolder as unknown) as jest.Mock;

describe('PrimoHolderContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiPost.mockResolvedValue({});
    mockCheckPrimoHolder.mockResolvedValue(false);
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
    mockCheckPrimoHolder.mockResolvedValue(true);
    mockApiGet.mockResolvedValue({ data: { publicKey: 'abc', betaRedeemed: false } });
    const { result } = renderHook(() => usePrimoHolder(), {
      wrapper: ({ children }) => <PrimoHolderProvider>{children}</PrimoHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(true));
  });

  test('handles fetch error gracefully', async () => {
    mockUseWallet.mockReturnValue({ publicKey: { toBase58: () => 'abc' } });
    mockCheckPrimoHolder.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePrimoHolder(), {
      wrapper: ({ children }) => <PrimoHolderProvider>{children}</PrimoHolderProvider>,
    });
    await waitFor(() => expect(result.current.isHolder).toBe(false));
  });
});
