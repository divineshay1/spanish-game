/** Pixel art for El Barrio, drawn in code: sky, a building front per place, the street. */
import { makeCanvas, bayer } from './canvas';
import { PAL } from '../game/palette';
import { rng } from './rng';

export const BW = 76; // building width

export function streetSky(w: number, h: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = y / h;
      ctx.fillStyle = t < 0.5 ? (bayer(x, y) < t * 2 ? PAL.pink : PAL.lavender) : bayer(x, y) < (t - 0.5) * 2 ? PAL.cream : PAL.pink;
      ctx.fillRect(x, y, 1, 1);
    }
  const r = rng(5);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = PAL.white;
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h * 0.4), 1, 1);
  }
  return c;
}

/** A shop or house front, 76 wide, with an awning and windows. */
export function facade(wall: string, h: number, seed: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(BW, h);
  const r = (x: number, y: number, w: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, hh);
  };
  const rr = rng(seed);
  const top = 6 + Math.floor(rr() * 10);
  r(2, top, BW - 4, h - top, PAL.plum);
  r(3, top + 1, BW - 6, h - top - 1, wall);
  // roof edge
  r(0, top - 3, BW, 4, PAL.plum);
  r(1, top - 2, BW - 2, 2, PAL.clay);
  // upper windows
  for (const wx of [10, 30, 50]) {
    r(wx, top + 8, 14, 12, PAL.plum);
    r(wx + 1, top + 9, 12, 10, rr() < 0.5 ? PAL.star : '#c3e6ff');
    r(wx + 7, top + 9, 1, 10, PAL.plum);
  }
  // awning stripes
  const ay = h - 44;
  for (let x = 4; x < BW - 4; x++) r(x, ay, 1, 7, Math.floor(x / 4) % 2 ? PAL.white : PAL.pink);
  r(4, ay + 7, BW - 8, 1, PAL.plum);
  // shop window and door
  r(8, h - 32, 30, 22, PAL.plum);
  r(9, h - 31, 28, 20, '#c3e6ff');
  r(10, h - 30, 6, 2, PAL.white);
  r(46, h - 36, 20, 36, PAL.plum);
  r(47, h - 35, 18, 35, PAL.bark);
  r(61, h - 18, 2, 2, PAL.star);
  // flower box
  r(8, h - 10, 30, 4, PAL.bark);
  for (let i = 0; i < 6; i++) r(10 + i * 5, h - 12, 2, 2, i % 2 ? PAL.pink : PAL.star);
  return c;
}

/** The street and pavement, tiling left-right. */
export function streetStrip(w: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, 24);
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = y < 8 ? (x % 12 === 0 || y === 0 ? PAL.clay : PAL.sand) : y < 10 ? PAL.plum : (y === 16 && x % 16 < 8) ? PAL.white : '#8f86a8';
      ctx.fillRect(x, y, 1, 1);
    }
  return c;
}
