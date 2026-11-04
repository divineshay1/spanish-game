import { bayer, makeCanvas, rgb } from './canvas';

/**
 * A vertical sky made of flat color bands blended with ordered dithering,
 * like the stripy dusk in classic handheld games.
 * stops: [position 0..1, color]
 */
export function skyCanvas(w: number, h: number, stops: [number, string][]): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const img = ctx.createImageData(w, h);
  const cols = stops.map(([, col]) => rgb(col));
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0] = stops[i];
    const [t1] = stops[i + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0 || 1)));
    for (let x = 0; x < w; x++) {
      const pick = f > bayer(x, y) ? cols[i + 1] : cols[i];
      const p = (y * w + x) * 4;
      img.data[p] = pick[0];
      img.data[p + 1] = pick[1];
      img.data[p + 2] = pick[2];
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
