import { getAssetsByCollection, getNFTByTokenAddress } from '../helius';
import { Helius } from 'helius-sdk';

const mockInstance = {
  searchAssets: jest.fn(),
  getAssetBatch: jest.fn(),
  getAsset: jest.fn(),
};

jest.mock('helius-sdk', () => ({
  Helius: jest.fn(() => mockInstance),
}));

beforeEach(() => {
  mockInstance.searchAssets.mockReset();
  mockInstance.getAssetBatch.mockReset();
  mockInstance.getAsset.mockReset();
});

test('getAssetsByCollection aggregates pages and maps fields', async () => {
  mockInstance.searchAssets.mockResolvedValueOnce({
    assets: { items: [{ id: '1' }] },
  });
  mockInstance.getAssetBatch.mockResolvedValueOnce({
    result: [
      {
        id: '1',
        content: { links: { image: 'img' }, metadata: { name: 'nft', attributes: [] }, files: [] },
        listing: {},
        marketplace: {},
      },
    ],
  });
  const assets = await getAssetsByCollection('col', 'owner');
  expect(assets).toEqual([
    { id: '1', image: 'img', name: 'nft', listed: true, attributes: [] },
  ]);
});

test('getNFTByTokenAddress fetches metadata and caches', async () => {
  mockInstance.getAsset.mockResolvedValueOnce({
    result: {
      id: 'id',
      content: { links: { image: 'img' }, metadata: { name: 'name', attributes: [] }, files: [] },
      listing: {},
    },
  });
  const nft = await getNFTByTokenAddress('token');
  expect(nft).toEqual({
    id: 'id',
    image: 'img',
    name: 'name',
    listed: true,
    attributes: [],
  });
  await getNFTByTokenAddress('token');
  expect(mockInstance.getAsset).toHaveBeenCalledTimes(1);
});
