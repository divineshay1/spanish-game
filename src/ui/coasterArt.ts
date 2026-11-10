/**
 * Pixel art for La Montaña Rusa, drawn in code on a small canvas that the
 * page scales up crisply: the dusk sky, a faraway town, blossom trees, the
 * pastel track with star lights, and Brote riding the heart-backed cart.
 */

export type Face = 'calm' | 'happy' | 'dizzy';
type Pal = { b: string; l: string; s: string };
type Tree = { x: number; r: number; p: Pal; dots?: [number, number][] };
type Building = { x: number; w: number; h: number; dome: boolean; spire: boolean; c: string[]; d: string[]; lit: boolean[] };

const TOWN = [['#f5b3d3', '#e294bd', '#ffd0e6'], ['#c8b4f2', '#a993dc', '#e2d6ff'], ['#a9d2f0', '#88b6dc', '#d3ecff'], ['#e9b6ef', '#cf95d9', '#f7d8fa']];
const TREE_PALS: Pal[] = [
  { b: '#f7a8cc', l: '#ffd3e6', s: '#e48bb8' }, { b: '#f4bde0', l: '#ffe4f2', s: '#de9cc8' },
  { b: '#c9aef0', l: '#e6d8ff', s: '#a98fd8' }, { b: '#fbe1ef', l: '#ffffff', s: '#efc0da' },
];
const PUFFS: [number, number, number, 's' | 'b'][] = [[-0.6, 0.2, 0.6, 's'], [0.6, 0.25, 0.6, 's'], [0, 0.3, 0.62, 'b'], [-0.45, -0.25, 0.6, 'b'], [0.45, -0.2, 0.6, 'b'], [0, -0.45, 0.66, 'b']];
const START_X = 46, GAP_X = 92;

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export function disk(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string): void {
  c.fillStyle = col;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  for (let dy = -r; dy <= r; dy++) {
    const h = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
    c.fillRect(cx - h, cy + dy, h * 2 + 1, 1);
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The world: scenery and the track, sized to the canvas. */
export class CoasterWorld {
  W = 200; H = 140; XEND = 0;
  stops: number[] = [];
  private xs: number[] = [];
  private len: number[] = [];
  private farTrees: Tree[] = [];
  private midTrees: Tree[] = [];
  private nearTrees: Tree[] = [];
  private branches: { x: number; top: boolean }[] = [];
  private skyline: Building[] = [];
  private stars: { x: number; y: number; t: number; c: string }[] = [];
  private clouds: { x: number; y: number; r: number }[] = [];

  constructor(private ctx: CanvasRenderingContext2D, private n: number) {}

  R(x: number, y: number, w: number, h: number, c: string): void {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  trackY(x: number): number {
    const { H } = this;
    const env = smooth(10, 70, x) * smooth(10, 70, this.XEND - x);
    return H * 0.5 + env * (H * 0.13 * Math.sin(x / 41) + H * 0.06 * Math.sin(x / 17 + 1.3)) + (1 - env) * H * 0.04;
  }

  private lenAt(x: number): number {
    return this.len[Math.min(this.len.length - 1, Math.round(x * 2))];
  }

  xAt(d: number): number {
    let lo = 0, hi = this.len.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (this.len[m] < d) lo = m + 1;
      else hi = m;
    }
    return this.xs[lo];
  }

  build(W: number, H: number, n: number = this.n): void {
    this.W = W; this.H = H; this.n = n;
    this.XEND = START_X + n * GAP_X + 70;
    this.xs = []; this.len = [];
    let d = 0, py = this.trackY(0);
    for (let x = 0; x <= this.XEND; x += 0.5) {
      const y = this.trackY(x);
      if (x) d += Math.hypot(0.5, y - py);
      py = y;
      this.xs.push(x);
      this.len.push(d);
    }
    const d0 = this.lenAt(START_X), d1 = this.lenAt(this.XEND - 70);
    this.stops = Array.from({ length: n + 1 }, (_, k) => d0 + ((d1 - d0) * k) / n);

    const rnd = seeded(7);
    const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
    this.stars = Array.from({ length: 34 }, () => ({ x: rnd() * W, y: rnd() * H * 0.3, t: rnd() * 6, c: rnd() < 0.4 ? '#ffe066' : '#ffffff' }));
    this.skyline = [];
    for (let x = 0; x < this.XEND * 0.15 + W + 40; ) {
      const w = 5 + Math.floor(rnd() * 5), h = 5 + Math.floor(rnd() * 13);
      this.skyline.push({ x, w, h, dome: rnd() < 0.7, spire: rnd() < 0.35, c: pick(TOWN), d: pick(TOWN), lit: Array.from({ length: 4 }, () => rnd() < 0.7) });
      x += w + (rnd() < 0.25 ? 14 + Math.floor(rnd() * 20) : Math.floor(rnd() * 3));
    }
    this.clouds = [];
    for (let x = 0; x < this.XEND * 0.05 + W + 80; x += 50 + rnd() * 50) this.clouds.push({ x, y: 10 + rnd() * H * 0.2, r: 5 + Math.floor(rnd() * 4) });
    this.farTrees = [];
    for (let x = 0; x < this.XEND * 0.4 + W + 40; x += 9 + rnd() * 12) this.farTrees.push({ x, r: 4 + Math.floor(rnd() * 4), p: pick(TREE_PALS) });
    this.midTrees = [];
    for (let x = 0; x < this.XEND * 0.7 + W + 60; x += 22 + rnd() * 20)
      this.midTrees.push({ x, r: 9 + Math.floor(rnd() * 6), p: pick(TREE_PALS), dots: Array.from({ length: 6 }, () => [rnd() * 2 - 1, rnd() * 2 - 1] as [number, number]) });
    this.nearTrees = [];
    for (let x = 0; x < this.XEND * 0.9 + W + 60; x += 26 + rnd() * 26)
      this.nearTrees.push({ x, r: 12 + Math.floor(rnd() * 7), p: pick(TREE_PALS), dots: Array.from({ length: 8 }, () => [rnd() * 2 - 1, rnd() * 2 - 1] as [number, number]) });
    this.branches = [];
    for (let x = 60; x < this.XEND * 1.25 + W; x += 140 + rnd() * 120) this.branches.push({ x, top: rnd() < 0.5 });
  }

  private line(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) this.R(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 1, 1, c);
  }

  private tree(x: number, ground: number, r: number, p: Pal, dots?: [number, number][]): void {
    const { ctx } = this;
    const cy = ground - r - Math.round(r * 0.55);
    this.R(x - 1, cy + 2, 3, ground - cy - 2, '#8b5c78');
    this.R(x + 1, cy + 2, 1, ground - cy - 2, '#6e4462');
    if (r >= 8) {
      this.line(x, cy + r * 0.6, x - r * 0.6, cy + 1, '#8b5c78');
      this.line(x + 1, cy + r * 0.5, x + r * 0.55, cy, '#8b5c78');
    }
    for (const [dx, dy, k, t] of PUFFS) disk(ctx, x + dx * r, cy + dy * r, r * k, t === 's' ? p.s : p.b);
    disk(ctx, x - r * 0.45, cy - r * 0.4, r * 0.32, p.l);
    disk(ctx, x + r * 0.1, cy - r * 0.6, r * 0.3, p.l);
    if (dots)
      for (const [dx, dy] of dots) {
        this.R(x + dx * r * 0.75, cy + dy * r * 0.6, 1, 1, '#ffffff');
        this.R(x - dy * r * 0.6, cy + dx * r * 0.5, 1, 1, '#fff3c4');
      }
  }

  private hills(camX: number, f: number, base: number, amp: number, k: number, col: string, phase: number): (sx: number) => number {
    const off = camX * f;
    const { ctx, W, H } = this;
    ctx.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const y = Math.round(base + amp * Math.sin((x + off) / k + phase));
      ctx.fillRect(x, y, 1, H - y);
    }
    return (sx) => Math.round(base + amp * Math.sin((sx + off) / k + phase));
  }

  /** Everything behind the cart. */
  back(camX: number, now: number, reduce: boolean, passed: number): void {
    const { ctx, W, H } = this;
    const R = this.R.bind(this);
    // dusk sky in dithered bands
    const bands = ['#7f7bcc', '#968bd8', '#b29ee2', '#ceaae2', '#e8b8dc', '#f6c6d8'];
    const bh = (H * 0.62) / bands.length;
    bands.forEach((c, i) => {
      const y0 = Math.round(i * bh);
      R(0, y0, W, Math.ceil(bh) + 1, c);
      if (i) {
        ctx.fillStyle = c;
        for (let x = i % 2; x < W; x += 2) ctx.fillRect(x, y0 - 1, 1, 1);
      }
    });
    R(0, Math.round(H * 0.62), W, H, '#f6c6d8');
    for (const c of this.clouds) {
      const cx = Math.round(c.x - camX * 0.05) - 20;
      if (cx < -40 || cx > W + 40) continue;
      disk(ctx, cx, c.y + 2, c.r + 1, '#b6a6e4');
      disk(ctx, cx - c.r, c.y + 3, c.r, '#c6b6ec');
      disk(ctx, cx + c.r + 2, c.y + 3, c.r - 1, '#c6b6ec');
      disk(ctx, cx, c.y, c.r, '#d9cdf4');
      disk(ctx, cx - 2, c.y - 1, c.r - 2, '#ece4fb');
      R(cx - c.r * 2, c.y + 4, c.r * 4 + 2, 2, '#c6b6ec');
    }
    for (const s of this.stars) if (reduce || Math.sin(s.t + now / 500) > -0.2) R(s.x, s.y, 1, 1, s.c);
    const mx = W - 26, my = 30;
    disk(ctx, mx, my, 11, 'rgba(255,240,250,.25)');
    for (let y = -6; y <= 6; y++)
      for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36 && (x - 3) * (x - 3) + (y + 2) * (y + 2) > 22) R(mx + x, my + y, 1, 1, '#fff6d8');

    // mountains, then the faraway town on its hill
    ctx.fillStyle = '#9d8ad0';
    for (let x = 0; x < W; x++) {
      const wx = x + camX * 0.12;
      const y = Math.round(H * 0.4 - 9 * Math.abs(Math.sin(wx / 38)) - 4 * Math.sin(wx / 13));
      ctx.fillRect(x, y, 1, H - y);
    }
    this.hills(camX, 0.15, H * 0.44, 2, 40, '#c2a6e6', 1);
    const off = camX * 0.15, base = Math.round(H * 0.43);
    for (const b of this.skyline) {
      const x = Math.round(b.x - off) + 8;
      if (x > W || x + b.w < 0) continue;
      const top = base - b.h;
      R(x, top, b.w, b.h + 2, b.c[0]);
      R(x + b.w - 2, top, 2, b.h + 2, b.c[1]);
      R(x, top, 1, b.h + 2, b.c[2]);
      if (b.dome) {
        disk(ctx, x + b.w / 2, top, Math.floor(b.w / 2) + 1, b.d[1]);
        disk(ctx, x + b.w / 2 - 1, top - 1, Math.floor(b.w / 2) - 1, b.d[0]);
        R(x + Math.floor(b.w / 2) - 2, top - Math.floor(b.w / 2) + 1, 1, 1, b.d[2]);
      } else for (let i = 0; i <= b.w / 2; i++) R(x + i, top - Math.floor(b.w / 2) + i, b.w - i * 2, 1, b.d[1]);
      if (b.spire) R(x + Math.floor(b.w / 2), top - Math.floor(b.w / 2) - 5, 1, 4, b.d[1]);
      b.lit.forEach((on, i) => {
        if (!on) return;
        const wx = x + 1 + (i % 2) * (b.w - 3), wy = top + 2 + Math.floor(i / 2) * 4;
        if (wy > base - 2) return;
        R(wx - 1, wy - 1, 3, 4, 'rgba(255,236,170,.35)');
        R(wx, wy, 1, 2, '#fff0b3');
      });
    }
    this.hills(camX, 0.22, H * 0.52, 4, 23, '#d9b8ec', 0);
    const h2 = this.hills(camX, 0.4, H * 0.58, 5, 17, '#ebbade', 2);
    for (const t of this.farTrees) {
      const sx = Math.round(t.x - camX * 0.4);
      if (sx >= -10 && sx <= W + 10) this.tree(sx, h2(sx) + 2, t.r, t.p);
    }
    const h3 = this.hills(camX, 0.7, H * 0.76, 3, 29, '#c4e3c9', 4);
    ctx.fillStyle = '#d9f0dc';
    for (let x = ((Math.floor(camX * 0.7) % 3) + 3) % 3; x < W; x += 3) ctx.fillRect(x, h3(x), 1, 1);
    for (const t of this.midTrees) {
      const sx = Math.round(t.x - camX * 0.7);
      if (sx >= -20 && sx <= W + 20) this.tree(sx, h3(sx) + 4, t.r, t.p, t.dots);
    }

    // a closer row of big blossom trees when the meadow has room for them
    if (H > 160)
      for (const t of this.nearTrees) {
        const sx = Math.round(t.x - camX * 0.9);
        if (sx >= -30 && sx <= W + 30) this.tree(sx, H + 2, t.r, t.p, t.dots);
      }
    // supports
    for (let wx = Math.floor(camX / 22) * 22; wx < camX + W + 22; wx += 22) {
      const sx = Math.round(wx - camX), y = Math.round(this.trackY(wx));
      R(sx, y + 3, 2, H - y, '#ecc8f0');
      R(sx + 1, y + 3, 1, H - y, '#c7a0dd');
      R(sx - 1, y + 3, 4, 1, '#d9a7d9');
      if (wx % 44 === 0) for (let yy = y + 10; yy < H; yy += 12) R(sx - 3, yy, 8, 1, '#e8c2ee');
    }
    // back rail, ties, front rail
    for (let sx = 0; sx < W; sx++) {
      const wx = sx + camX, y = Math.round(this.trackY(wx));
      R(sx, y - 3, 1, 1, '#f3d0ec');
      if (Math.floor(wx) % 5 === 0) R(sx, y - 2, 1, 2, '#c99ad9');
      R(sx, y, 1, 1, '#fff2f8');
      R(sx, y + 1, 1, 2, '#f6aacd');
      R(sx, y + 3, 1, 1, '#d98abf');
    }
    // curly scrollwork
    for (let wx = Math.ceil(camX / 11) * 11; wx < camX + W + 4; wx += 11) {
      const sx = Math.round(wx - camX), y = Math.round(this.trackY(wx)) + 5;
      for (const [dx, dy] of [[0, 0], [1, 0], [2, 1], [2, 2], [1, 3], [0, 2], [-1, 1]]) R(sx + dx, y + dy, 1, 1, '#e6b2e2');
    }
    // draped string lights with glowing star bulbs
    for (let wx = Math.ceil(camX / 14) * 14; wx < camX + W + 14; wx += 14) {
      for (let i = 0; i < 14; i += 2) {
        const xx = wx + i;
        R(Math.round(xx - camX), Math.round(this.trackY(xx)) + 10 + Math.sin((Math.PI * i) / 14) * 3, 1, 1, '#c99ad9');
      }
      for (const i of [3, 10]) {
        const xx = wx + i, sx = Math.round(xx - camX), y = Math.round(this.trackY(xx) + 11 + Math.sin((Math.PI * i) / 14) * 3);
        if (reduce || Math.sin(now / 350 + xx) > -0.6) {
          disk(ctx, sx, y, 2, 'rgba(255,232,150,.35)');
          R(sx, y - 1, 1, 3, '#ffe680');
          R(sx - 1, y, 3, 1, '#ffe680');
          R(sx, y, 1, 1, '#ffffff');
        } else R(sx, y, 1, 1, '#e6c7a8');
      }
    }
    // a flag at each stop (gold once passed), and the flower gate at the end
    for (let k = 1; k < this.n; k++) {
      const wx = this.xAt(this.stops[k]), sx = Math.round(wx - camX), y = Math.round(this.trackY(wx));
      if (sx < -6 || sx > W + 6) continue;
      const done = passed >= k;
      R(sx, y - 12, 1, 12, '#8f76d9');
      R(sx + 1, y - 12, 5, 3, done ? '#ffe066' : '#fcb4db');
      R(sx + 1, y - 9, 3, 1, done ? '#ffe066' : '#fcb4db');
      if (done) this.sparkle(sx + 3, y - 15, '#ffe066');
    }
    const ex = this.xAt(this.stops[this.n]);
    const gx = Math.round(ex - camX), gy = Math.round(this.trackY(ex));
    if (gx > -30 && gx < W + 30) {
      R(gx - 14, gy - 34, 3, 34, '#8f76d9');
      R(gx + 12, gy - 34, 3, 34, '#8f76d9');
      for (let a = 0; a <= 12; a++) {
        const ang = (Math.PI * a) / 12, fx = gx + Math.cos(ang) * 14, fy = gy - 34 - Math.sin(ang) * 10;
        disk(ctx, fx, fy, 2, a % 2 ? '#fb9ecd' : '#ffffff');
        R(fx, fy, 1, 1, '#ffe066');
      }
      for (let i = 0; i < 8; i++) R(gx - 10 + i * 3, gy - 30, 3, 3, i % 2 ? '#fff7fc' : '#b399f5');
    }
  }

  /** Blossom branches in front of everything. */
  front(camX: number): void {
    const { ctx, W, H } = this;
    for (const b of this.branches) {
      const sx = Math.round(b.x - camX * 1.25);
      if (sx < -40 || sx > W + 40) continue;
      for (let i = 0; i < 5; i++) {
        const bx = sx + i * 7 - 14, by = b.top ? 4 + (i % 2) * 5 : H - 4 - (i % 2) * 5;
        disk(ctx, bx, by, 5, i % 2 ? '#f7a8cc' : '#ffc9e2');
        this.R(bx - 1, by - 1, 1, 1, '#ffffff');
        this.R(bx + 2, by + 1, 1, 1, '#ffe066');
      }
    }
  }

  sparkle(x: number, y: number, c: string, big = false): void {
    const R = this.R.bind(this);
    R(x, y, 1, 1, '#ffffff');
    R(x - 1, y, 1, 1, c); R(x + 1, y, 1, 1, c); R(x, y - 1, 1, 1, c); R(x, y + 1, 1, 1, c);
    if (big) { R(x - 2, y, 1, 1, c); R(x + 2, y, 1, 1, c); R(x, y - 2, 1, 1, c); R(x, y + 2, 1, 1, c); }
  }
}

/** Brote in the heart-backed cart, drawn upright; rotate it when drawing. Rail point = (24, 48). */
export function drawRider(sc: CanvasRenderingContext2D, face: Face, t: number, reduce: boolean): void {
  const SR = (x: number, y: number, w: number, h: number, c: string) => {
    sc.fillStyle = c;
    sc.fillRect(x, y, w, h);
  };
  sc.clearRect(0, 0, 48, 52);
  const ox = 24, oy = 48;
  // heart-shaped seat back, behind Brote
  const hx = ox - 9, hy = oy - 29;
  const heart = (grow: number, col: string) => {
    disk(sc, hx - 3, hy, 4 + grow, col);
    disk(sc, hx + 3, hy, 4 + grow, col);
    for (let y = 0; y < 8 + grow; y++) {
      const w = 8 + grow - y;
      SR(hx - w, hy + 1 + y, w * 2 + 1, 1, col);
    }
  };
  heart(1, '#6b4fa8');
  heart(0, '#f7a8cc');
  disk(sc, hx - 4, hy - 1, 2, '#ffd3e6');
  SR(hx - 5, hy - 2, 1, 1, '#ffffff');
  SR(hx, hy + 1, 1, 3, '#ffe066');
  SR(hx - 1, hy + 2, 3, 1, '#ffe066');
  // Brote: a round cream sprout with two leaves on top
  const by = oy - 24 + (face === 'happy' && !reduce ? Math.round(Math.sin(t / 90)) : 0);
  SR(ox, by - 11, 1, 4, '#5fae7f');
  SR(ox - 4, by - 13, 4, 2, '#8fd6a6'); SR(ox - 5, by - 12, 2, 1, '#8fd6a6'); SR(ox - 3, by - 13, 2, 1, '#c3f0cf');
  SR(ox + 1, by - 14, 4, 2, '#8fd6a6'); SR(ox + 4, by - 13, 2, 1, '#8fd6a6'); SR(ox + 2, by - 14, 2, 1, '#c3f0cf');
  disk(sc, ox, by, 8, '#6b4fa8');
  disk(sc, ox, by, 7, '#fff3e8');
  disk(sc, ox + 3, by + 2, 4, '#f3dfe8');
  disk(sc, ox - 2, by - 2, 4, '#fffaf4');
  const E = '#4b3a7a';
  const dots = (pts: number[][]) => pts.forEach(([x, y]) => SR(ox + x, by + y, 1, 1, E));
  if (face === 'happy') dots([[-4, -1], [-3, -2], [-2, -1], [2, -1], [3, -2], [4, -1]]);
  else if (face === 'dizzy') {
    dots([[-4, -2], [-2, -2], [-3, -1], [-4, 0], [-2, 0], [2, -2], [4, -2], [3, -1], [2, 0], [4, 0]]);
    SR(ox + 6, by - 6, 1, 2, '#9fd4ff');
    SR(ox + 5, by - 5, 3, 2, '#9fd4ff');
  } else {
    SR(ox - 3, by - 2, 2, 2, E); SR(ox + 2, by - 2, 2, 2, E);
    SR(ox - 3, by - 2, 1, 1, '#ffffff'); SR(ox + 2, by - 2, 1, 1, '#ffffff');
  }
  SR(ox - 6, by + 1, 2, 1, '#fb9ecd'); SR(ox + 5, by + 1, 2, 1, '#fb9ecd');
  if (face === 'dizzy') SR(ox - 1, by + 3, 3, 1, E);
  else dots([[-1, 2], [1, 2], [0, 3]]);
  // cart body: lavender and pink panels, gold trim, rounded nose, gold star
  const L = ox - 15, Rt = ox + 14, T = oy - 18, B = oy - 5;
  SR(L, T, Rt - L + 1, B - T + 1, '#6b4fa8');
  SR(L + 1, T + 1, Rt - L - 1, B - T - 1, '#cfaef0');
  SR(L + 1, T + 7, Rt - L - 1, B - T - 7, '#f6aacb');
  SR(L + 1, T + 1, Rt - L - 1, 2, '#f5c76a');
  SR(L + 1, T + 1, Rt - L - 1, 1, '#fff0b8');
  SR(L + 1, T + 6, Rt - L - 1, 1, '#f5c76a');
  SR(L + 2, T + 3, 1, 3, '#e4d2ff');
  SR(L + 2, T + 8, 1, 3, '#ffd1e3');
  sc.clearRect(Rt, T, 1, 2); sc.clearRect(Rt - 1, T, 1, 1); sc.clearRect(Rt, B - 1, 1, 2); sc.clearRect(Rt - 1, B, 1, 1);
  SR(Rt - 1, T + 1, 1, 1, '#6b4fa8'); SR(Rt, T + 2, 1, 1, '#6b4fa8'); SR(Rt - 1, B - 1, 1, 1, '#6b4fa8');
  const sx0 = ox + 2, sy0 = oy - 11;
  SR(sx0, sy0 - 3, 1, 7, '#ffe066'); SR(sx0 - 3, sy0, 7, 1, '#ffe066'); SR(sx0 - 1, sy0 - 1, 3, 3, '#ffe066');
  SR(sx0 - 2, sy0 + 2, 1, 1, '#ffe066'); SR(sx0 + 2, sy0 + 2, 1, 1, '#ffe066'); SR(sx0, sy0 - 1, 1, 1, '#fff6c8');
  SR(ox - 10, oy - 11, 1, 1, '#ffffff'); SR(ox + 9, oy - 9, 1, 1, '#ffffff');
  // star wheels
  for (const wx of [ox - 9, ox + 8]) {
    disk(sc, wx, oy - 4, 4, '#6b4fa8');
    disk(sc, wx, oy - 4, 3, '#c6aaf0');
    SR(wx, oy - 6, 1, 5, '#ffe066');
    SR(wx - 2, oy - 4, 5, 1, '#ffe066');
    SR(wx, oy - 4, 1, 1, '#ffffff');
  }
}
