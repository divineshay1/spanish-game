import { PAL } from '../game/palette';
import { bayer, drawPixelMap, makeCanvas } from './canvas';
import { rng } from './rng';

/**
 * Placeholder sprites drawn in code. All original.
 * Real art dropped into public/assets/ later replaces these by key name.
 */

export function sparkleSmall(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(5, 5);
  drawPixelMap(ctx, ['..a..', '..b..', 'abwba', '..b..', '..a..'], { a: PAL.lilac, b: PAL.rose, w: PAL.white });
  return c;
}

export function sparkleBig(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(9, 9);
  drawPixelMap(
    ctx,
    ['....a....', '....a....', '....b....', '...bwb...', 'aabwwwbaa', '...bwb...', '....b....', '....a....', '....a....'],
    { a: PAL.lilac, b: PAL.rose, w: PAL.white },
  );
  return c;
}

export function starGold(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(7, 7);
  drawPixelMap(ctx, ['...y...', '..yyy..', 'yyywyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.'], {
    y: PAL.star,
    w: PAL.white,
  });
  return c;
}

export function dot(color: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return c;
}

/** Thin crescent moon facing left, cream with a lilac edge. */
export function moon(size = 15): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const r = size / 2;
  const cut = { x: r + size * 0.28, y: r - size * 0.18, r: r * 0.86 };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      const ex = x + 0.5 - cut.x;
      const ey = y + 0.5 - cut.y;
      const e = Math.sqrt(ex * ex + ey * ey);
      if (e < cut.r) continue;
      ctx.fillStyle = d > r - 1.2 || e < cut.r + 0.9 ? PAL.cream : PAL.white;
      ctx.fillRect(x, y, 1, 1);
    }
  return c;
}

/** Soft round glow made of dithered rings (no blur, stays pixel-art). */
export function glow(size: number, color: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(size, size);
  const r = size / 2;
  ctx.fillStyle = color;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const t = 1 - Math.sqrt(dx * dx + dy * dy) / r;
      if (t <= 0) continue;
      if (t * t * 1.4 > bayer(x, y)) ctx.fillRect(x, y, 1, 1);
    }
  return c;
}

/**
 * The floating island of El Cielo: grassy top, sandy cliff,
 * lavender rocks hanging underneath, with a small arched door.
 */
export function island(w = 120, h = 64): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const r = rng(7);
  const top = 14;
  const cx = w / 2;
  const rx = w / 2 - 2;
  // underside: an upside-down rocky cone with a wobbly outline
  const depth: number[] = [];
  for (let x = 0; x < w; x++) {
    const nx = (x - cx) / rx;
    const base = Math.max(0, 1 - nx * nx);
    depth.push(Math.floor(top + 4 + base * (h - top - 8) * (0.75 + 0.25 * Math.sin(x * 0.7) * r())));
  }
  for (let x = 0; x < w; x++) {
    const nx = (x - cx) / rx;
    if (Math.abs(nx) > 1) continue;
    const ry = 4 * Math.sqrt(1 - nx * nx); // top ellipse half-height
    const yTop = Math.round(top - ry);
    const yRim = Math.round(top + ry);
    for (let y = yTop; y <= depth[x]; y++) {
      let col: string;
      if (y <= yRim - 1) col = y === yTop ? PAL.white : PAL.mint; // grass top
      else if (y <= yRim + 1) col = PAL.sage; // grass lip
      else if (y <= yRim + 5) col = (x + y) % 5 === 0 ? PAL.clay : PAL.sand; // soil
      else {
        const shade = (y - yRim) / (depth[x] - yRim + 1);
        col = shade > 0.6 ? PAL.plum : shade > 0.3 || nx > 0.4 ? PAL.deepLav : PAL.lavender;
        if (y === depth[x]) col = PAL.plum;
      }
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // tiny grass tufts and flowers on top
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(cx - rx * 0.85 + r() * rx * 1.7);
    const y = Math.floor(top - 2 + r() * 5);
    ctx.fillStyle = r() < 0.35 ? PAL.pink : r() < 0.5 ? PAL.star : PAL.sage;
    ctx.fillRect(x, y, 1, 1);
  }
  return c;
}

/** A small arched portal door (a realm entrance). */
export function door(color: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(13, 17);
  drawPixelMap(
    ctx,
    [
      '....ooooo....',
      '..ooiiiiioo..',
      '.oiiwwwwwiio.',
      '.oiwddddddio.',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwdddsddddio',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwdddddddkio',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwddddddddio',
      'oiwddddddddio',
      'ooooooooooooo',
    ],
    { o: PAL.plum, i: PAL.cream, w: PAL.white, d: color, s: PAL.star, k: PAL.star },
  );
  return c;
}

/** Original companion placeholder: a round cloud-puff creature with a star tuft. */
export function companion(frame: 0 | 1): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(14, 13);
  const rows =
    frame === 0
      ? [
          '......y.......',
          '.....yyy......',
          '......y.......',
          '....wwwww.....',
          '..wwwwwwwww...',
          '.wwwwwwwwwww..',
          '.wwewwwwwewl..',
          'wwwwwwwwwwwwl.',
          'wwwpwwwwwpwwl.',
          'wwwwwwmwwwwll.',
          '.wwwwwwwwwll..',
          '..lwwwwwwll...',
          '...ll...ll....',
        ]
      : [
          '..............',
          '......y.......',
          '.....yyy......',
          '....wwyww.....',
          '..wwwwwwwww...',
          '.wwwwwwwwwww..',
          '.wwewwwwwewl..',
          'wwwwwwwwwwwwl.',
          'wwwpwwwwwpwwl.',
          'wwwwwwmwwwwll.',
          '.wwwwwwwwwll..',
          '..lwwwwwwll...',
          '..ll.....ll...',
        ];
  drawPixelMap(ctx, rows, { w: PAL.white, l: PAL.lilac, e: PAL.plum, p: PAL.pink, m: PAL.deepLav, y: PAL.star });
  return c;
}

/** Settings gear button (11x11) on a small cream tile. */
export function gear(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(15, 15);
  drawPixelMap(
    ctx,
    [
      'ooooooooooooooo',
      'owwwwwwwwwwwwwo',
      'owwwwwpwwwwwwwo',
      'owwpwpppwpwwwwo',
      'owwwpppppwwwwwo',
      'owwppplpppwwwwo',
      'owppplllpppwwwo',
      'owwppllllppwwwo',
      'owppplllpppwwwo',
      'owwppplpppwwwwo',
      'owwwpppppwwwwwo',
      'owwpwpppwpwwwwo',
      'owwwwwpwwwwwwwo',
      'obbbbbbbbbbbbbo',
      'ooooooooooooooo',
    ],
    { o: PAL.plum, w: PAL.cream, p: PAL.deepLav, l: PAL.cream, b: PAL.blush },
  );
  return c;
}
