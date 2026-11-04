/**
 * Pixel-perfect sizing. The game is drawn at a tiny resolution (about 180x320)
 * and scaled up by a whole number so every pixel stays a crisp square.
 * The game area grows slightly to fill tall phones instead of leaving bars.
 */
export const BASE_W = 180;
export const BASE_H = 320;
export const MAX_W = 216;
export const MAX_H = 440;

export interface PixelFit {
  /** game size in game pixels */
  width: number;
  height: number;
  /** device pixels per game pixel (whole number) */
  zoom: number;
  /** css size of the canvas */
  cssWidth: number;
  cssHeight: number;
}

export function fitPixels(cssW: number, cssH: number, dpr: number): PixelFit {
  const physW = Math.max(1, Math.floor(cssW * dpr));
  const physH = Math.max(1, Math.floor(cssH * dpr));
  const zoom = Math.max(1, Math.floor(Math.min(physW / BASE_W, physH / BASE_H)));
  const width = Math.min(MAX_W, Math.max(BASE_W, Math.floor(physW / zoom)));
  const height = Math.min(MAX_H, Math.max(BASE_H, Math.floor(physH / zoom)));
  return { width, height, zoom, cssWidth: (width * zoom) / dpr, cssHeight: (height * zoom) / dpr };
}
