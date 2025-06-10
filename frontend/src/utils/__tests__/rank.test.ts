import { getRankColor } from '../rank';

describe('getRankColor', () => {
  test('returns base color when rank or total supply missing', () => {
    expect(getRankColor(null, 1000)).toBe('#b87333');
    expect(getRankColor(10, null)).toBe('#b87333');
  });

  test('returns correct colors based on rank percentage', () => {
    expect(getRankColor(1, 100)).toBe('#e5e4e2');
    expect(getRankColor(4, 100)).toBe('#FFD700');
    expect(getRankColor(15, 100)).toBe('#C0C0C0');
    expect(getRankColor(50, 100)).toBe('#b87333');
  });
});
