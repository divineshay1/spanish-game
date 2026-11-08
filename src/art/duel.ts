/** Pixel art for El Duelo, drawn in code: a deep-space arena and eight original enemies. */
import { makeCanvas, bayer } from './canvas';
import { rng } from './rng';
import { PAL } from '../game/palette';

export function spaceCanvas(w: number, h: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = y / h;
      ctx.fillStyle = t > 0.8 && bayer(x, y) < (t - 0.8) * 3 ? '#1b0523' : '#07000b';
      ctx.fillRect(x, y, 1, 1);
    }
  const r = rng(31);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = r() < 0.3 ? '#c86bd8' : r() < 0.5 ? PAL.lilac : PAL.white;
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1);
  }
  // a few purple star bursts
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h * 0.8);
    const len = 2 + Math.floor(r() * 3);
    for (let k = -len; k <= len; k++) {
      ctx.fillStyle = Math.abs(k) < 2 ? PAL.white : '#a04bb8';
      ctx.fillRect(x + k, y, 1, 1);
      ctx.fillRect(x, y + k, 1, 1);
    }
  }
  return c;
}

const EMBLEMS: string[][] = [
  // La Duda: a question mark of fog
  ['..www..', '.w...w.', '.....w.', '...ww..', '...w...', '.......', '...w...'],
  // El Olvido: a cobweb
  ['w..w..w', '.w.w.w.', '..www..', 'wwwwwww', '..www..', '.w.w.w.', 'w..w..w'],
  // La Prisa: an hourglass
  ['wwwwwww', '.wyyyw.', '..wyw..', '...w...', '..w.w..', '.wyyyw.', 'wwwwwww'],
  // El Eco: a bell
  ['...w...', '..www..', '.wwwww.', '.wwwww.', '.wwwww.', 'wwwwwww', '...y...'],
  // La Sombra: a dark crescent
  ['..www..', '.ww....', 'ww.....', 'ww.....', 'ww.....', '.ww....', '..www..'],
  // El Espejo Roto: a cracked mirror
  ['.wwwww.', 'wcccccw', 'wcc.ccw', 'wc.c.cw', 'wccc.cw', 'wcccccw', '.wwwww.'],
  // La Rosa Marchita: a drooping rose
  ['..ppp..', '.ppppp.', '..ppp..', '...g...', '..gg...', '.g.g...', '...g...'],
  // La Reina del Silencio: a crown
  ['y..y..y', 'yy.y.yy', 'yyyyyyy', 'yryyyry', 'yyyyyyy', '.......', '.......'],
];
const BODY = [PAL.lilac, '#9a92b0', PAL.sand, '#7cc8ff', PAL.plum, PAL.cream, PAL.pink, PAL.deepLav];

/** An original wispy spirit (32x32): body colour and emblem per enemy, with a hurt frame. */
export function enemyCanvas(i: number, hurt = false): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(32, 32);
  const body = hurt ? PAL.white : BODY[i % BODY.length];
  const px = (x: number, y: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  };
  const grid: boolean[][] = Array.from({ length: 32 }, () => Array(32).fill(false));
  for (let y = 2; y < 30; y++)
    for (let x = 3; x < 29; x++) {
      const dx = (x - 15.5) / 12.5;
      const dy = (y - 13) / 11;
      let inside = dx * dx + dy * dy <= 1;
      if (y > 13) inside = Math.abs(dx) <= 1 && y < 27 + Math.round(Math.sin(x * 1.3) * 2);
      if (inside) grid[y][x] = true;
    }
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      if (grid[y][x]) px(x, y, body);
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => grid[y + b]?.[x + a])) px(x, y, '#2a1438');
    }
  // shading and eyes
  for (let y = 4; y < 27; y++) if (grid[y][26]) px(26, y, hurt ? PAL.rose : '#00000030');
  px(10, 9, PAL.white);
  px(11, 9, PAL.white);
  for (const ex of [11, 19]) {
    px(ex, 12, '#2a1438');
    px(ex + 1, 12, '#2a1438');
    px(ex, 13, '#2a1438');
    px(ex + 1, 13, '#2a1438');
  }
  const cols: Record<string, string> = { w: PAL.white, y: PAL.star, c: '#c3e6ff', p: PAL.pink, g: PAL.sage, r: '#e8607a' };
  EMBLEMS[i % EMBLEMS.length].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (cols[row[x]]) px(12 + x, 16 + y, cols[row[x]]);
  });
  return c;
}
