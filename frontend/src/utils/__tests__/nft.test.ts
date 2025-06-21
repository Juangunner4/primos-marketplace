import { getNftRank } from '../nft';

describe('getNftRank', () => {
  test('uses rarityRank when available', () => {
    expect(getNftRank({ rarityRank: 5 }, null)).toBe(5);
  });

  test('uses rank when rarityRank missing', () => {
    expect(getNftRank({ rank: 2 }, null)).toBe(2);
  });

  test('extracts rank from attributes', () => {
    const attrs = [{ trait_type: 'Rank', value: '7' }];
    expect(getNftRank({}, attrs)).toBe(7);
  });

  test('returns null when not found', () => {
    expect(getNftRank({}, [])).toBeNull();
  });
});
