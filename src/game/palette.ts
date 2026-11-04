/** Palette from SPEC.md. Hex numbers for Phaser, strings for canvas. */
export const PAL = {
  pink: '#fb9ecd',
  blush: '#fcb4db',
  lavender: '#b399f5',
  cream: '#f6e4f8',
  sky: '#0ea1ff',
  navy: '#000099',
  star: '#ffe066',
  // extra soft tones derived from the palette (cloud shading, glow)
  white: '#fff7fc',
  lilac: '#d9c6f7',
  rose: '#f1d1ed',
  deepLav: '#8f76d9',
  plum: '#6b4fa8',
  // garden and island neutrals
  mint: '#a6dcb4',
  sage: '#7cbf94',
  sand: '#f0d6b4',
  clay: '#d6ab8c',
  bark: '#a8786a',
} as const;

export const hex = (c: string): number => parseInt(c.slice(1), 16);
