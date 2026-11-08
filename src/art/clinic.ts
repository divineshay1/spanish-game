/**
 * Pixel art for La Clínica, drawn in code: an original, simply stylised
 * (faceless) patient in front and back views with poses, and two rooms.
 */
import { makeCanvas, bayer, rgb } from './canvas';
import { PAL } from '../game/palette';
import type { Look } from '../engine/clinic';

export const PAT_W = 40;
export const PAT_H = 80;

export interface Pose {
  mouth?: boolean;
  arm?: boolean;
  breathe?: boolean;
  cuff?: boolean;
  thermo?: boolean;
  /** second breathing frame */
  inhale?: boolean;
}

/** Body regions in figure pixels, for tapping where it hurts. */
export const HOTSPOTS: Record<string, { x: number; y: number; w: number; h: number; view: 'front' | 'back' }[]> = {
  cabeza: [{ x: 12, y: 1, w: 16, h: 16, view: 'front' }],
  garganta: [{ x: 16, y: 17, w: 8, h: 4, view: 'front' }],
  pecho: [{ x: 11, y: 21, w: 18, h: 11, view: 'front' }],
  estómago: [{ x: 11, y: 32, w: 18, h: 14, view: 'front' }],
  brazo: [{ x: 4, y: 21, w: 7, h: 26, view: 'front' }, { x: 29, y: 21, w: 7, h: 26, view: 'front' }],
  pierna: [{ x: 11, y: 46, w: 18, h: 32, view: 'front' }],
  espalda: [{ x: 10, y: 20, w: 20, h: 27, view: 'back' }],
};

function shade(hex: string, t: number): string {
  const c = rgb(hex).map((v) => Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function patientCanvas(look: Look, gender: 'f' | 'm', view: 'front' | 'back', pose: Pose): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(PAT_W, PAT_H);
  const grid: (string | null)[][] = Array.from({ length: PAT_H }, () => Array(PAT_W).fill(null));
  const put = (x: number, y: number, col: string) => {
    if (x >= 0 && y >= 0 && x < PAT_W && y < PAT_H) grid[y][x] = col;
  };
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, col);
  };
  const disc = (cx: number, cy: number, r: number, col: string) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) put(cx + x, cy + y, col);
  };
  const skin = look.skin;
  const shirt = look.shirt;
  const shirtD = shade(shirt, -0.18);
  const pants = look.pants;
  const pantsD = shade(pants, -0.2);
  const hair = look.hair;
  const back = view === 'back';
  const wide = pose.inhale ? 1 : 0;

  // legs and shoes
  rect(12, 46, 7, 29, pants);
  rect(21, 46, 7, 29, pants);
  rect(18, 46, 1, 29, pantsD);
  rect(27, 46, 1, 29, pantsD);
  rect(11, 75, 8, 4, '#4a3a32');
  rect(21, 75, 8, 4, '#4a3a32');
  // torso (wider on the in-breath)
  rect(11 - wide, 20, 18 + wide * 2, 27, shirt);
  rect(11 - wide, 20, 18 + wide * 2, 1, shade(shirt, 0.2));
  rect(28 + wide, 21, 1, 26, shirtD);
  // left arm (patient's right) hangs down
  rect(5, 21, 6, 24, shirt);
  rect(5, 21, 1, 24, shirtD);
  disc(7, 46, 2, skin);
  // other arm: raised for "levante el brazo"
  if (pose.arm) {
    rect(29, 1, 6, 21, shirt);
    rect(34, 1, 1, 21, shirtD);
    disc(32, 0, 2, skin);
  } else {
    rect(29, 21, 6, 24, shirt);
    rect(34, 21, 1, 24, shirtD);
    disc(32, 46, 2, skin);
    if (pose.cuff) {
      rect(28, 25, 8, 7, '#8c9aa6');
      rect(31, 27, 2, 3, PAL.white);
    }
  }
  // neck and head
  rect(17, 16, 6, 5, skin);
  disc(20, 9, 7, skin);
  if (back) {
    // hair covers the whole head from behind
    disc(20, 9, 7, hair);
    if (gender === 'f') rect(13, 9, 14, 13, hair);
  } else {
    // simple faceless style: hair frame and rosy cheeks
    for (let x = 13; x <= 27; x++) for (let y = 2; y <= 5; y++) if ((x - 20) ** 2 + (y - 9) ** 2 <= 52) put(x, y, hair);
    if (gender === 'f') {
      rect(12, 5, 3, 15, hair);
      rect(25, 5, 3, 15, hair);
    } else {
      put(13, 6, hair);
      put(27, 6, hair);
    }
    put(16, 11, shade(skin, -0.12));
    put(24, 11, shade(skin, -0.12));
    put(16, 12, '#f2a0b0');
    put(24, 12, '#f2a0b0');
    if (pose.mouth) rect(19, 12, 3, 2, '#6a3a3a');
    if (pose.thermo) {
      rect(21, 12, 7, 1, '#cfd8dc');
      put(28, 12, '#d96b6b');
    }
  }
  // dark outline around everything
  const out: [number, number][] = [];
  for (let y = 0; y < PAT_H; y++)
    for (let x = 0; x < PAT_W; x++) {
      if (grid[y][x]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx]);
      if (n) out.push([x, y]);
    }
  for (const [x, y] of out) grid[y][x] = '#4a3560';
  for (let y = 0; y < PAT_H; y++)
    for (let x = 0; x < PAT_W; x++)
      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x]!;
        ctx.fillRect(x, y, 1, 1);
      }
  return c;
}

export const patientKey = (look: Look, gender: string, view: string, pose: Pose) =>
  `pat-${look.skin}${look.hair}${look.shirt}${look.pants}-${gender}-${view}-${['mouth', 'arm', 'cuff', 'thermo', 'inhale'].filter((k) => (pose as Record<string, boolean>)[k]).join('.')}`;

/** Clinic room background: cream wall, lavender wainscot, window, sand floor. */
export function roomCanvas(w: number, h: number, room: 'desk' | 'exam'): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const floorY = h - 16;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let col: string = PAL.cream;
      if (y >= floorY) col = (x + y) % 9 === 0 ? PAL.clay : PAL.sand;
      else if (y >= floorY - 22) col = y === floorY - 22 ? PAL.white : (y - floorY) % 2 === 0 && bayer(x, y) > 0.5 ? PAL.lilac : PAL.lavender;
      else col = bayer(x, y) > 0.94 ? PAL.rose : PAL.cream;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  const r = (x: number, y: number, ww: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, ww, hh);
  };
  // window with a pink sky and a cloud
  r(10, 12, 42, 34, PAL.plum);
  r(11, 13, 40, 32, PAL.blush);
  r(11, 13, 40, 10, PAL.lavender);
  r(18, 26, 14, 4, PAL.white);
  r(22, 23, 7, 3, PAL.white);
  r(30, 13, 1, 32, PAL.plum);
  r(11, 28, 40, 1, PAL.plum);
  r(8, 46, 46, 3, PAL.plum);
  r(9, 46, 44, 2, PAL.white);
  if (room === 'desk') {
    // clinic sign with a cross
    r(w - 40, 12, 28, 26, PAL.plum);
    r(w - 39, 13, 26, 24, PAL.white);
    r(w - 28, 17, 4, 16, PAL.pink);
    r(w - 34, 23, 16, 4, PAL.pink);
  } else {
    // exam bed on the left, cabinet on the right
    r(4, floorY - 20, 46, 8, PAL.plum);
    r(5, floorY - 19, 44, 5, PAL.white);
    r(5, floorY - 15, 44, 2, PAL.lilac);
    r(8, floorY - 12, 3, 12, PAL.plum);
    r(43, floorY - 12, 3, 12, PAL.plum);
    r(w - 30, 10, 24, 40, PAL.plum);
    r(w - 29, 11, 22, 38, PAL.sand);
    r(w - 29, 29, 22, 1, PAL.plum);
    r(w - 20, 18, 3, 3, PAL.clay);
    r(w - 20, 37, 3, 3, PAL.clay);
  }
  return c;
}

/** Front desk with a computer, drawn over the patient's lower half at check-in. */
export function deskCanvas(w: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, 30);
  const r = (x: number, y: number, ww: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, ww, hh);
  };
  r(0, 8, w, 22, PAL.plum);
  r(0, 9, w, 21, PAL.clay);
  r(0, 9, w, 3, PAL.sand);
  for (let x = 6; x < w; x += 24) r(x, 15, 1, 15, shade(PAL.clay, -0.15));
  // computer
  r(12, -0, 26, 9, PAL.plum);
  r(13, 1, 24, 6, '#9db3bf');
  r(23, 7, 4, 2, PAL.plum);
  return c;
}
