import { makeCanvas } from './canvas';
import { rng } from './rng';

export interface CloudTones {
  light: string;
  mid: string;
  shade: string;
  deep: string;
}

/**
 * Chunky pixel clouds: each cloud is a pile of round puffs.
 * Every puff is lit from the top-left: cream on top, lavender underneath.
 */
export function cloudLayer(
  w: number,
  h: number,
  seed: number,
  count: number,
  size: number,
  tones: CloudTones,
): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const r = rng(seed);
  for (let k = 0; k < count; k++) {
    const cx = Math.floor((k + 0.2 + r() * 0.6) * (w / count));
    const cy = Math.floor(h * (0.25 + r() * 0.5));
    const puffs: [number, number, number][] = [];
    const n = 4 + Math.floor(r() * 4);
    const span = size * (1.6 + r());
    for (let i = 0; i < n; i++) {
      const px = cx + (i / (n - 1) - 0.5) * span * 2;
      const mid = 1 - Math.abs(i / (n - 1) - 0.5) * 2;
      const pr = size * (0.45 + mid * 0.55) * (0.8 + r() * 0.4);
      puffs.push([px, cy - mid * size * 0.5, pr]);
    }
    // flat bottom
    const bottom = cy + size * 0.35;
    // draw back puffs first (bigger y first is fine since all share bottom)
    puffs.sort((a, b) => a[2] - b[2]);
    for (const [px, py, pr] of puffs) drawPuff(ctx, px, py, pr, bottom, tones, w);
  }
  return c;
}

function drawPuff(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pr: number,
  bottom: number,
  t: CloudTones,
  wrapW: number,
): void {
  const r2 = pr * pr;
  for (let y = Math.floor(py - pr); y <= Math.ceil(Math.min(bottom, py + pr)); y++) {
    for (let x = Math.floor(px - pr); x <= Math.ceil(px + pr); x++) {
      const dx = x - px;
      const dy = y - py;
      if (dx * dx + dy * dy > r2) continue;
      // lighting: distance from a light spot up and to the left
      const lx = dx + pr * 0.35;
      const ly = dy + pr * 0.45;
      const l = Math.sqrt(lx * lx + ly * ly) / pr;
      const nearBottom = bottom - y;
      let col = t.light;
      if (nearBottom < 2) col = t.deep;
      else if (l > 1.05 || nearBottom < 4) col = t.shade;
      else if (l > 0.7) col = t.mid;
      ctx.fillStyle = col;
      // wrap horizontally so the layer tiles seamlessly
      const wx = ((x % wrapW) + wrapW) % wrapW;
      ctx.fillRect(wx, y, 1, 1);
    }
  }
}
