import { CARD_VARIANTS, getRandomCardVariantName } from '../cardVariants';

describe('cardVariants utilities', () => {
  test('random name is part of variants', () => {
    const name = getRandomCardVariantName();
    const names = CARD_VARIANTS.map(v => v.name);
    expect(names).toContain(name);
  });
});
