export const CARD_VARIANTS = [
  { name: 'yellow', bg: '#fffbe6', border: '#e2c275' },
  { name: 'green', bg: '#e6ffe6', border: '#2e8b57' },
  { name: 'blue', bg: '#e6f0ff', border: '#4169e1' },
];

export function getRandomCardVariantName() {
  const idx = Math.floor(Math.random() * CARD_VARIANTS.length);
  return CARD_VARIANTS[idx].name;
}