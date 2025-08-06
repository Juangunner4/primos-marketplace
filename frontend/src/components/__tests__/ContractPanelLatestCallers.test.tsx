import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContractPanel from '../ContractPanel';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { fetchTrenchData } from '../../services/trench';
import { getNFTByTokenAddress } from '../../utils/helius';

jest.mock('../../services/token', () => ({
  fetchTokenMetadata: jest.fn().mockResolvedValue(null),
  fetchTokenInfo: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/coingecko', () => ({
  fetchCoinGeckoData: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../services/trench', () => ({
  fetchTrenchData: jest.fn(),
}));

jest.mock('../../utils/helius', () => ({
  getNFTByTokenAddress: jest.fn(),
  fetchCollectionNFTsForOwner: jest.fn().mockResolvedValue([]),
}));

describe('ContractPanel latest callers', () => {
  test('loads caller images via getNFTByTokenAddress', async () => {
    (fetchTrenchData as jest.Mock).mockResolvedValue({
      contracts: [{ contract: 'abc' }],
      users: [],
      latestCallers: {
        abc: [
          { caller: 'c1', pfp: 'token1' },
          { caller: 'c2', pfp: 'token2' },
        ],
      },
    });
    (getNFTByTokenAddress as jest.Mock)
      .mockResolvedValueOnce({ image: 'img1' })
      .mockResolvedValueOnce({ image: 'img2' });

    render(
      <I18nextProvider i18n={i18n}>
        <ContractPanel contract="abc" open={true} onClose={() => {}} />
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(getNFTByTokenAddress).toHaveBeenCalledTimes(2);
    });

    const avatars = screen.getAllByAltText('Caller profile picture');
    expect(avatars[0]).toHaveAttribute('src', 'img1');
    expect(avatars[1]).toHaveAttribute('src', 'img2');
  });
});
