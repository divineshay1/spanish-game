/** Pixel art for La Biblioteca, drawn in code: a cosy night library and story books. */
import { makeCanvas, bayer } from './canvas';
import { rng } from './rng';
import { PAL } from '../game/palette';

const BOOK_COLS = [PAL.pink, PAL.lavender, PAL.mint, PAL.sand, '#7cc8ff', PAL.blush, PAL.deepLav, PAL.clay];

export function libraryCanvas(w: number, h: number, shelfY: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const r = (x: number, y: number, ww: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh));
  };
  const floorY = h - 40;
  // wall: soft lavender with dithered wallpaper stripes; wooden floor
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let col: string = x % 12 < 6 ? PAL.cream : bayer(x, y) > 0.5 ? PAL.rose : PAL.cream;
      if (y >= floorY) col = (y - floorY) % 7 === 0 ? PAL.bark : (x + Math.floor((y - floorY) / 7) * 9) % 31 === 0 ? PAL.bark : PAL.clay;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  r(0, floorY - 2, w, 2, PAL.plum);
  // round rug
  for (let y = 0; y < 16; y++)
    for (let x = -50; x <= 50; x++)
      if ((x / 50) ** 2 + ((y - 8) / 8) ** 2 <= 1) {
        ctx.fillStyle = (x / 50) ** 2 + ((y - 8) / 8) ** 2 > 0.7 ? PAL.pink : PAL.blush;
        ctx.fillRect(w / 2 + x, floorY + 12 + y, 1, 1);
      }
  // arched window with the night sky, moon and stars
  const wx = w / 2 - 26;
  const wy = 32;
  r(wx - 2, wy - 2, 56, 50, PAL.plum);
  for (let y = 0; y < 46; y++)
    for (let x = 0; x < 52; x++) {
      const t = y / 46;
      ctx.fillStyle = t < 0.4 ? (bayer(x, y) < t * 2 ? PAL.deepLav : PAL.navy) : bayer(x, y) < (t - 0.4) * 1.6 ? PAL.pink : PAL.deepLav;
      ctx.fillRect(wx + x, wy + y, 1, 1);
    }
  const rr = rng(4);
  for (let i = 0; i < 14; i++) r(wx + rr() * 52, wy + rr() * 26, 1, 1, rr() < 0.3 ? PAL.star : PAL.white);
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16 && (x - 2) ** 2 + (y + 1) ** 2 > 10) r(wx + 40 + x, wy + 10 + y, 1, 1, PAL.cream);
  r(wx + 25, wy, 2, 46, PAL.plum);
  r(wx, wy + 22, 52, 2, PAL.plum);
  r(wx - 4, wy + 46, 60, 3, PAL.plum);
  r(wx - 3, wy + 46, 58, 2, PAL.sand);
  // tall decorative bookshelves on both sides
  const top = 28;
  const shelf = (sx: number, sw: number) => {
    r(sx, top, sw, floorY - top, PAL.plum);
    r(sx + 1, top + 1, sw - 2, floorY - top - 2, PAL.bark);
    for (let row = 0; row < 6; row++) {
      const y0 = top + 4 + row * ((floorY - top - 10) / 6);
      const hh = (floorY - top - 10) / 6 - 3;
      let x = sx + 3;
      while (x < sx + sw - 4) {
        const bw = 2 + Math.floor(rr() * 3);
        const bh = hh - Math.floor(rr() * 4);
        const col = BOOK_COLS[Math.floor(rr() * BOOK_COLS.length)];
        r(x, y0 + (hh - bh), bw, bh, col);
        r(x, y0 + (hh - bh) + 2, bw, 1, PAL.white);
        x += bw + (rr() < 0.15 ? 2 : 0);
      }
      r(sx + 1, y0 + hh, sw - 2, 2, PAL.plum);
    }
  };
  shelf(3, 24);
  shelf(w - 27, 24);
  // the story shelf plank
  r(w / 2 - 70, shelfY, 140, 5, PAL.plum);
  r(w / 2 - 69, shelfY, 138, 3, PAL.sand);
  r(w / 2 - 66, shelfY + 5, 3, 6, PAL.plum);
  r(w / 2 + 63, shelfY + 5, 3, 6, PAL.plum);
  // a warm lamp
  r(w / 2 + 52, floorY - 30, 2, 28, PAL.plum);
  r(w / 2 + 46, floorY - 36, 14, 8, PAL.plum);
  r(w / 2 + 47, floorY - 35, 12, 6, PAL.star);
  r(w / 2 + 49, floorY - 3, 8, 2, PAL.plum);
  return c;
}

/** A story book standing on the shelf (18x30): coloured by level, with a ribbon once read. */
export function bookCanvas(col: string, read: boolean): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(18, 30);
  const r = (x: number, y: number, ww: number, hh: number, cc: string) => {
    ctx.fillStyle = cc;
    ctx.fillRect(x, y, ww, hh);
  };
  r(0, 0, 18, 30, PAL.plum);
  r(1, 1, 16, 28, col);
  r(1, 1, 2, 28, PAL.white);
  r(4, 5, 11, 1, PAL.plum);
  r(4, 24, 11, 1, PAL.plum);
  r(7, 11, 5, 5, PAL.cream);
  r(8, 12, 3, 3, PAL.star);
  if (read) {
    r(12, 0, 3, 10, PAL.star);
    r(12, 10, 1, 2, PAL.star);
    r(14, 10, 1, 2, PAL.star);
  }
  return c;
}

export const LEVEL_COL: Record<string, string> = { A1: PAL.mint, A2: PAL.pink, B1: PAL.lavender };
