import { describe, expect, it } from 'vitest';
import { fitPixels, BASE_W, BASE_H } from './pixelScale';

describe('fitPixels', () => {
  it('fills an iPhone screen with whole-number scaling', () => {
    const f = fitPixels(390, 844, 3); // iPhone 14
    expect(Number.isInteger(f.zoom)).toBe(true);
    expect(f.zoom).toBe(6);
    expect(f.width).toBe(195);
    expect(f.height).toBe(422);
    expect(f.cssWidth).toBeLessThanOrEqual(390);
    expect(f.cssHeight).toBeLessThanOrEqual(844);
  });
  it('never goes below the base size', () => {
    const f = fitPixels(100, 100, 1);
    expect(f.width).toBe(BASE_W);
    expect(f.height).toBe(BASE_H);
    expect(f.zoom).toBe(1);
  });
  it('caps width on wide screens so the layout stays portrait', () => {
    const f = fitPixels(1920, 1080, 1);
    expect(f.width).toBeLessThanOrEqual(216);
    expect(f.zoom).toBe(3);
  });
});
