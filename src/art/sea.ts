/** Night sea for La Isla de Inmersión, drawn in code: navy sky, dithered dusk bands, bright water. */
import { makeCanvas, bayer } from './canvas';
import { rng } from './rng';
import { PAL } from '../game/palette';

export function seaCanvas(w: number, h: number, horizon: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const bands: [number, string][] = [
    [0, PAL.navy],
    [0.55, PAL.navy],
    [0.7, PAL.deepLav],
    [0.8, PAL.lavender],
    [0.88, PAL.pink],
    [0.95, PAL.blush],
    [1, PAL.white],
  ];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let col: string;
      if (y < horizon) {
        const t = y / horizon;
        let i = 0;
        while (i < bands.length - 2 && t > bands[i + 1][0]) i++;
        const f = (t - bands[i][0]) / (bands[i + 1][0] - bands[i][0] || 1);
        col = f > bayer(x, y) ? bands[i + 1][1] : bands[i][1];
      } else {
        const t = (y - horizon) / (h - horizon);
        col = t < 0.05 ? (bayer(x, y) > 0.5 ? '#7cc8ff' : PAL.sky) : PAL.sky;
        if ((y - horizon) % 9 === 3 && (x + y * 3) % 23 < 7) col = '#7cc8ff';
        if ((y - horizon) % 13 === 6 && (x * 7 + y) % 31 < 4) col = PAL.white;
      }
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  const r = rng(21);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = r() < 0.25 ? PAL.star : r() < 0.5 ? PAL.lilac : PAL.white;
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * horizon * 0.7), 1, 1);
  }
  // a little sandy islet with an original pastel palm
  const ix = Math.round(w * 0.25);
  const iy = horizon + 12;
  for (let y = 0; y < 6; y++)
    for (let x = -18; x <= 18; x++)
      if ((x / 18) ** 2 + ((y - 1) / 5) ** 2 <= 1) {
        ctx.fillStyle = y < 2 ? PAL.cream : PAL.sand;
        ctx.fillRect(ix + x, iy + y, 1, 1);
      }
  ctx.fillStyle = PAL.bark;
  for (let y = 0; y < 16; y++) ctx.fillRect(ix + Math.round(y * 0.25) - 2, iy - y, 2, 1);
  ctx.fillStyle = PAL.mint;
  for (const [dx, dy, len, dir] of [[2, -17, 9, 1], [2, -17, 8, -1], [2, -16, 6, 1], [2, -16, 7, -1]] as const)
    for (let k = 0; k < len; k++) ctx.fillRect(ix + dx + dir * k, iy + dy + Math.floor((k * k) / 12), 1, 1);
  return c;
}

/** A strip of foamy wave crests that tiles left-right (256 wide). */
export function waveCanvas(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(256, 8);
  for (let x = 0; x < 256; x++) {
    const y = Math.round(3 + 2 * Math.sin((x / 256) * Math.PI * 8));
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = '#c3e6ff';
    ctx.fillRect(x, y + 1, 1, 1);
  }
  return c;
}

/** The companion's star-shaped float (15x8). */
export function starFloat(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(15, 8);
  const rows = ['.......y.......', '......yyy......', 'yyyyyyywyyyyyyy', '.yyyyyyyyyyyyy.', '..yyyyyyyyyyy..', '..yyyyy.yyyyy..', '.yyyy.....yyyy.', '.yy.........yy.'];
  rows.forEach((row, y) => {
    for (let x = 0; x < 15; x++)
      if (row[x] !== '.') {
        ctx.fillStyle = row[x] === 'w' ? PAL.white : PAL.star;
        ctx.fillRect(x, y, 1, 1);
      }
  });
  return c;
}
