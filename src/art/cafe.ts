/** Pixel art for El Café, drawn in code: the room and 14 little menu icons (12x12). */
import { makeCanvas, drawPixelMap, bayer } from './canvas';
import { PAL } from '../game/palette';

export function cafeRoom(w: number, h: number, counterY: number): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const r = (x: number, y: number, ww: number, hh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh));
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = y < counterY ? ((x >> 3) + (y >> 3)) % 2 === 0 ? PAL.blush : bayer(x, y) > 0.6 ? PAL.pink : PAL.blush : PAL.clay;
      ctx.fillRect(x, y, 1, 1);
    }
  // menu board
  const T = 26; // below the top bar
  r(w / 2 - 44, T + 6, 88, 30, PAL.bark);
  r(w / 2 - 42, T + 8, 84, 26, '#3d2b3a');
  // round window with the pink sky
  r(8, T + 8, 22, 22, PAL.plum);
  r(10, T + 10, 18, 18, PAL.lavender);
  r(10, T + 20, 18, 8, PAL.pink);
  r(18, T + 10, 2, 18, PAL.plum);
  // hanging lamps
  for (const lx of [w - 34, w - 18]) {
    r(lx, T, 1, 8, PAL.plum);
    r(lx - 4, T + 8, 9, 4, PAL.plum);
    r(lx - 3, T + 9, 7, 2, PAL.star);
  }
  // shelf with cups
  r(w - 46, T + 34, 40, 2, PAL.bark);
  for (let i = 0; i < 5; i++) r(w - 44 + i * 8, T + 29, 5, 5, i % 2 ? PAL.white : PAL.mint);
  // the counter
  r(0, counterY - 4, w, 4, PAL.sand);
  r(0, counterY - 4, w, 1, PAL.white);
  r(0, counterY, w, 1, PAL.plum);
  for (let x = 8; x < w; x += 20) r(x, counterY + 4, 1, h - counterY - 4, PAL.bark);
  return c;
}

const C: Record<string, string> = {
  o: PAL.plum, w: PAL.white, c: PAL.cream, b: '#7a4b3a', B: '#a8735a', t: '#d9a35a', h: '#5a3326', l: '#c3e6ff', k: '#9ad0f5',
  m: '#fff7fc', n: '#ffb35a', N: '#ff9a3a', p: PAL.pink, P: PAL.blush, y: PAL.star, g: PAL.sage, G: PAL.mint, r: '#e8607a', s: PAL.sand, S: PAL.clay,
};

const ICONS: Record<string, string[]> = {
  cafe: ['............', '...w..w.....', '....w..w....', '............', '.oooooooo...', '.obbbbbbooo.', '.obbbbbbo.o.', '.ocBccccooo.', '.occcccco...', '..occcco....', 'oooooooooo..', '............'],
  taza: ['............', '....w.w.....', '...w.w......', '............', '.ooooooooo..', '.ohhhhhhhoo.', '.ohhhhhhho.o', '.occccccco.o', '.occccccccoo', '..occccco...', '.ooooooooo..', '............'],
  te: ['............', '....w.......', '.....w......', '..oooooooo..', '..otttttto..', '..otttttto.o', '..oPPPPPPooo', '..oPPPPPPo..', '...oPPPPo...', '....oooo....', '..oooooooo..', '............'],
  choco: ['............', '...wwww.....', '..woooooow..', '..ommmmmmo..', '..ohhhhhhoo.', '..ohhhhhho.o', '..opppppho.o', '..opppppphoo', '..ohhhhhho..', '..ohhhhhho..', '...oooooo...', '............'],
  agua: ['............', '...oooooo...', '...owwwwo...', '...olllll...', '...olllllo..', '...okkkkko..', '...olllllo..', '...okkkkko..', '...olllllo..', '...owlllo...', '....oooo....', '............'],
  leche: ['............', '...oooooo...', '...owwwwo...', '...ommmmmo..', '...ommmmmo..', '...ommmmmo..', '...ocmmmmo..', '...ommmmmo..', '...ommmmmo..', '...ocmmmo...', '....oooo....', '............'],
  jugo: ['.......o....', '...oooooo...', '...owwwwo...', '...onnnnno..', '...oNnnnno..', '...onnnnNo..', '...onnnnno..', '...oNnnnno..', '...onnnnno..', '...onnnNo...', '....oooo....', '............'],
  pan: ['............', '............', '...oooooo...', '..oPpPpPpo..', '.oPpPpPpPpo.', '.opPpPpPpPo.', '.oPpPpPpPpo.', '.ostttttsso.', '..oooooooo..', '............', '............', '............'],
  sandwich: ['............', '............', '..oooooooo..', '.ossssssssso', '.oGGGGGGGGGo', '.orrrrrrrrro', '.oyyyyyyyyyo', '.ossssssssso', '..oooooooooo', '............', '............', '............'],
  sopa: ['............', '....w..w....', '.....w..w...', '............', 'oooooooooooo', 'onnnnnnnnnno', '.onnNnnnNno.', '..owwwwwwo..', '...owwwwo...', '....oooo....', '............', '............'],
  ensalada: ['............', '...g.G.g....', '..GgGrGgG...', '.oGgGgyGgGo.', 'oooooooooooo', 'owwwwwwwwwwo', '.owwwwwwwwo.', '..owwwwwwo..', '...oooooo...', '............', '............', '............'],
  arepa: ['............', '............', '...oooooo...', '..osssssso..', '.ossSssSsso.', '.osssssssso.', '.osSssssSso.', '..osssssso..', '...oooooo...', '............', '............', '............'],
  azucar: ['............', '.....oo.....', '....oyyo....', '..oooooooo..', '..owwwwwwo..', '.oowwwwwwoo.', '.o.owwwwo.o.', '...owwwwo...', '...owwwwo...', '....oooo....', '............', '............'],
  servilleta: ['............', '............', '..ooooooooo.', '..oPPPPPPPo.', '..oPwwwwwPo.', '..oPwPPPwPo.', '..oPwwwwwPo.', '..oPPPPPPPo.', '..ooooooooo.', '............', '............', '............'],
};

export function iconCanvas(id: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(12, 12);
  drawPixelMap(ctx, ICONS[id] || ICONS.cafe, C);
  return c;
}
export const ICON_IDS = Object.keys(ICONS);
