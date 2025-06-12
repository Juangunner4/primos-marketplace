export const CARD_VARIANTS = [
  { name: 'yellow', bg: '#fffbe6', border: '#e2c275' },
  { name: 'green', bg: '#e6ffe6', border: '#2e8b57' },
  { name: 'blue', bg: '#e6f0ff', border: '#4169e1' },
  // Add these for rank
  { name: 'gold', bg: '#ffe066', border: '#ffd700' },
  { name: 'silver', bg: '#f8f9fa', border: '#b0b0b0' },
  { name: 'bronze', bg: '#fbeee0', border: '#cd7f32' },
];

/**
 * Returns a random card variant name from the base variants (yellow, green, blue).
 * @returns One of "yellow", "green", or "blue".
 */
export function getRandomCardVariantName() {
  const idx = Math.floor(Math.random() * 3); // Only randomize among yellow, green, blue
  return CARD_VARIANTS[idx].name;
}