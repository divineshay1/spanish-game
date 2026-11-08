/**
 * Pixel plants for El Jardín, drawn in code. Original art.
 * stage 0..8 = spaced-repetition box (seed → glowing star-flower)
 * thirst 0 fine, 1 due (droops), 2 very overdue (fades). Never dies.
 * Each word family has its own flower shape and colour.
 */
import { makeCanvas, rgb } from './canvas';
import { PAL } from '../game/palette';
import type { Family } from '../engine/cards';

export const PLANT_W = 16;
export const PLANT_H = 26;

type Shape = 'round' | 'star' | 'tulip' | 'daisy';
interface Look {
  shape: Shape;
  main: string;
  light: string;
  center: string;
}

export const FAMILY_LOOK: Record<Family, Look> = {
  paciente: { shape: 'round', main: PAL.pink, light: PAL.blush, center: PAL.star },
  imagen: { shape: 'daisy', main: PAL.white, light: PAL.cream, center: PAL.star },
  tarjetas: { shape: 'tulip', main: PAL.lavender, light: PAL.lilac, center: PAL.white },
  frases: { shape: 'star', main: PAL.blush, light: PAL.white, center: PAL.pink },
  raices: { shape: 'round', main: '#7cc8ff', light: '#c3e6ff', center: PAL.white },
  verbos: { shape: 'star', main: PAL.deepLav, light: PAL.lilac, center: PAL.star },
  siete: { shape: 'tulip', main: '#f7b58a', light: '#fbd3b5', center: PAL.star },
  mias: { shape: 'daisy', main: PAL.lilac, light: PAL.white, center: PAL.pink },
  vocab: { shape: 'round', main: PAL.star, light: PAL.white, center: PAL.clay },
};

/** Spanish names for the flower beds. */
export const FAMILY_NAME: Record<Family, string> = {
  paciente: 'Con pacientes',
  imagen: 'Imágenes',
  tarjetas: 'Todos los días',
  frases: 'Frases',
  raices: 'Raíces',
  verbos: 'Verbos',
  siete: 'Siete pasos',
  mias: 'Mis palabras',
  vocab: 'Vocabulario',
};

export const STAGE_NAME = ['Semilla', 'Brote', 'Dos hojas', 'Plantita', 'Frondosa', 'Capullo', 'Flor', 'Flor plena', 'Flor estrella'];
export const STAGE_EN = ['Seed', 'Sprout', 'Two leaves', 'Small plant', 'Leafy', 'Bud', 'Flower', 'Full bloom', 'Star flower'];

// petal masks: f = petal, F = petal highlight, c = centre, s = stem colour
const MASKS: Record<Shape, string[][]> = {
  round: [
    ['.f.', 'fcf', '.f.'],
    ['.fFf.', 'fFfff', 'ffcff', 'fffff', '.fff.'],
    ['..fff..', '.fFFff.', 'fFfffff', 'fffcfff', 'fffffff', '.fffff.', '..fff..'],
  ],
  star: [
    ['f.f', '.c.', 'f.f'],
    ['F...f', '.fFf.', '.fcf.', '.fff.', 'f...f'],
    ['F..f..f', '.F.f.f.', '..fFf..', 'fffcfff', '..fff..', '.f.f.f.', 'f..f..f'],
  ],
  tulip: [
    ['f.f', 'fFf', '.f.'],
    ['f.f.f', 'fFfff', 'fFfff', '.fff.', '..s..'],
    ['f..f..f', 'ff.f.ff', 'fFfffff', 'fFfffff', '.fffff.', '..fff..', '...s...'],
  ],
  daisy: [
    ['.f.', 'fcf', '.f.'],
    ['.f.f.', 'ffcff', '.ccc.', 'ffcff', '.f.f.'],
    ['..f.f..', '.ff.ff.', 'ffcccff', '..ccc..', 'ffcccff', '.ff.ff.', '..f.f..'],
  ],
};

function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

interface StageSpec {
  h: number;
  leaves: [at: number, size: 1 | 2 | 3, side: -1 | 1][];
  head: 'none' | 'bud' | 0 | 1 | 2;
}

const STAGES: StageSpec[] = [
  { h: 0, leaves: [], head: 'none' },
  { h: 2, leaves: [[2, 1, -1], [2, 1, 1]], head: 'none' },
  { h: 4, leaves: [[3, 2, -1], [4, 2, 1]], head: 'none' },
  { h: 7, leaves: [[2, 2, 1], [4, 2, -1], [6, 1, 1]], head: 'none' },
  { h: 9, leaves: [[2, 3, -1], [4, 2, 1], [6, 2, -1], [8, 1, 1]], head: 'none' },
  { h: 11, leaves: [[2, 3, 1], [4, 3, -1], [7, 2, 1], [9, 1, -1]], head: 'bud' },
  { h: 11, leaves: [[2, 3, -1], [4, 3, 1], [7, 2, -1], [9, 2, 1]], head: 1 },
  { h: 12, leaves: [[2, 3, 1], [4, 3, -1], [6, 2, 1], [9, 2, -1]], head: 2 },
  { h: 12, leaves: [[2, 3, -1], [4, 3, 1], [6, 2, -1], [9, 2, 1]], head: 2 },
];

export function plantCanvas(fam: Family, stage: number, thirst: 0 | 1 | 2): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(PLANT_W, PLANT_H);
  const look = FAMILY_LOOK[fam];
  const spec = STAGES[Math.max(0, Math.min(8, stage))];
  const dryT = thirst === 2 ? 0.55 : thirst === 1 ? 0.2 : 0;
  const dry = (col: string, toward: string = PAL.clay) => (dryT ? mix(col, toward, dryT) : col);
  // greens darker than the grass so plants stand out
  const stem = dry('#4f8f6a', PAL.clay);
  const leaf = dry('#6fb88a', '#d8c6a0');
  const leafDark = dry('#3f7a5a', PAL.clay);
  const petal = dry(look.main, thirst === 2 ? PAL.sand : PAL.cream);
  const petalLight = dry(look.light, PAL.cream);
  const center = dry(look.center, PAL.sand);

  const px = (x: number, y: number, col: string) => {
    if (x < 0 || y < 0 || x >= PLANT_W || y >= PLANT_H) return;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  };

  // soil mound (moist and darker when watered, pale when thirsty)
  const soilTop = thirst === 2 ? PAL.sand : thirst === 1 ? PAL.clay : PAL.bark;
  const soilLow = thirst === 2 ? PAL.clay : PAL.bark;
  for (let x = 4; x < 12; x++) px(x, 23, soilTop);
  for (let x = 3; x < 13; x++) px(x, 24, soilLow);
  for (let x = 3; x < 13; x++) px(x, 25, mix(soilLow, PAL.plum, 0.35));
  px(5, 23, mix(soilTop, PAL.white, 0.3));

  const baseX = 7;
  const baseY = 22;
  if (spec.h === 0) {
    // a seed peeking out of the soil
    px(7, 22, PAL.bark);
    px(8, 22, mix(PAL.bark, PAL.white, 0.3));
    px(7, 21, mix(PAL.bark, PAL.white, 0.15));
    return c;
  }

  const bend = thirst === 2 ? 4 : thirst === 1 ? 3 : 0;
  const sx = (i: number) => baseX + Math.round(bend * Math.pow(i / spec.h, 2));
  const sy = (i: number) => baseY - i + (bend ? Math.round(Math.pow(i / spec.h, 3) * (bend - 1)) : 0);
  for (let i = 0; i <= spec.h; i++) px(sx(i), sy(i), stem);

  // leaves: little rounded shapes pointing out (and down when thirsty)
  for (const [at, size, side] of spec.leaves) {
    const i = Math.min(at, spec.h);
    const x0 = sx(i);
    const y0 = sy(i);
    const droop = thirst ? 1 : 0;
    for (let k = 1; k <= size + 1; k++) {
      const yy = y0 - (k > 1 && !droop ? 1 : 0) + (droop && k > 1 ? 1 : 0);
      px(x0 + side * k, yy, k === size + 1 ? leafDark : leaf);
      if (size >= 2 && k >= 2 && k <= size) px(x0 + side * k, yy + 1, leafDark);
    }
  }

  // flower head
  const tx = sx(spec.h);
  const ty = sy(spec.h);
  if (spec.head === 'bud') {
    px(tx, ty - 1, leaf);
    px(tx + 1, ty - 1, leafDark);
    px(tx, ty - 2, petal);
    px(tx + 1, ty - 2, petal);
    px(tx, ty - 3, petalLight);
    return c;
  }
  if (spec.head === 'none') return c;
  const mask = MASKS[look.shape][spec.head];
  const r = (mask.length - 1) / 2;
  const cx = tx + (thirst ? 1 : 0);
  const cy = ty - r - 1 + (thirst ? 1 : 0);
  mask.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const col = ch === 'f' ? petal : ch === 'F' ? petalLight : ch === 'c' ? center : ch === 's' ? stem : null;
      if (col) px(cx - r + x, cy - r + y, col);
    }
  });
  if (stage === 7) {
    // a second little bud beside the bloom
    px(sx(7) - 3, sy(7) - 1, petalLight);
    px(sx(7) - 3, sy(7), petal);
    px(sx(7) - 2, sy(7) + 1, leaf);
  }
  if (stage >= 8 && !thirst) {
    // star-flower sparkle points
    for (const [dx, dy] of [[-5, -4], [5, -2], [-4, 3], [4, 4]]) px(cx + dx, cy + dy, PAL.star);
    px(cx, cy - r - 2, PAL.white);
  }
  return c;
}

/** Texture key, created on first use. */
export const plantKey = (fam: Family, stage: number, thirst: number) => `plant-${fam}-${stage}-${thirst}`;
