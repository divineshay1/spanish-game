/**
 * Estrellas Fugaces: a full-screen arcade round over El Cielo.
 * Words fall as meteors; tap the one that matches the prompt.
 * "Mi jardín" uses your plants, and each right zap waters a thirsty one.
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { SET_LABEL, pairsFor, canUseGarden, zap, miss, finishStars, type StarSet, type StarPair } from '../engine/estrellas';
import { shield } from './shield';

type Meteor = { es: string; x: number; y: number; w: number; h: number; vy: number; hue: string; dead: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };
type Msg = { text: string; x: number; y: number; life: number; wrong?: boolean };

const FONT = "'Pixelify Sans', monospace";
const HUES = ['#fb9ecd', '#b399f5', '#7cc8ff', '#ffe066', '#a6dcb4'];

let layer: HTMLDivElement | null = null;
let cv: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let raf = 0;
let onClose: (() => void) | null = null;

let set: StarSet = 'clinic';
let mode: 'menu' | 'play' | 'over' = 'menu';
let pairs: StarPair[] = [];
let hearts = 3, score = 0, combo = 0, speed = 38, spawnT = 0, shake = 0, grown = 0, lastXP = 0;
let target: StarPair | null = null;
let meteors: Meteor[] = [], sparks: Spark[] = [], beams: { x: number; y: number; life: number }[] = [];
let stars: { x: number; y: number; s: number; tw: number; c: string }[] = [];
let msg: Msg | null = null;
let watered = new Set<string>();
let W = 0, H = 0, P = 3, last = 0;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => layer!.querySelector<T>(sel)!;
const reduce = () => state().settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
const say = (t: string) => speak(t, state());
const snap = (v: number) => Math.round(v / P) * P;
const px = (x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(snap(x), snap(y), Math.max(P, snap(w)), Math.max(P, snap(h)));
};
const rnd = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const starsOpen = (): boolean => !!layer && !layer.hidden;

export function openEstrellas(close?: () => void): void {
  onClose = close ?? null;
  if (!layer) build();
  layer!.hidden = false;
  resize();
  mode = 'menu';
  menu();
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

function closeEstrellas(): void {
  if (mode === 'play' && score > 0) finishStars(state(), score);
  mode = 'menu';
  stopSpeaking();
  cancelAnimationFrame(raf);
  commit();
  if (layer) layer.hidden = true;
  onClose?.();
}

function build(): void {
  layer = document.createElement('div');
  layer.id = 'estrellas';
  layer.className = 'stars-layer';
  layer.innerHTML = `
    <canvas class="stars-sky" aria-label="Words fall from the sky as meteors. Tap the one that matches the prompt."></canvas>
    <div class="stars-hud"><span class="hearts"></span><span class="combo"></span><span class="score">0</span><button class="stars-x" data-act="close" aria-label="Close">✕</button></div>
    <div class="stars-ask" hidden><div class="card"><small class="lbl"></small><span class="txt"></span></div><button data-act="say" aria-label="Hear the word">🔊</button></div>
    <div class="stars-over"></div>`;
  shield(layer);
  document.body.appendChild(layer);
  cv = $<HTMLCanvasElement>('canvas');
  ctx = cv.getContext('2d')!;
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    tap(e.clientX - r.left, e.clientY - r.top);
  });
  layer.addEventListener('click', onClick);
  addEventListener('resize', () => starsOpen() && resize());
}

function resize(): void {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  W = innerWidth;
  H = innerHeight;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  P = Math.max(2, Math.round(Math.min(W, 520) / 140));
  stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.15 ? 2 : 1, tw: Math.random() * 6,
    c: Math.random() < 0.25 ? '#ffe066' : Math.random() < 0.5 ? '#d9c6f7' : '#fff',
  }));
}

// ---- screens ----

function menu(title = 'Estrellas Fugaces', text = ''): void {
  const S = state();
  const garden = canUseGarden(S);
  if (mode !== 'over' && set === 'clinic' && garden) set = 'jardin';
  if (set === 'jardin' && !garden) set = 'clinic';
  mode = mode === 'over' ? 'over' : 'menu';
  $('.stars-ask').hidden = true;
  const sets = (Object.keys(SET_LABEL) as StarSet[])
    .map((k) => {
      const off = k === 'jardin' && !garden;
      return `<button class="chipbtn" data-act="set" data-set="${k}" aria-pressed="${k === set}" ${off ? 'disabled' : ''}>${SET_LABEL[k]}</button>`;
    })
    .join('');
  const auto = S.settings.starsAuto;
  $('.stars-over').innerHTML = `
    <h1>${title}</h1>
    <p>${text || 'Words fall like shooting stars. Tap the meteor with the right Spanish before it lands. Three hearts. It speeds up as you go.'}</p>
    <div class="modes" role="group" aria-label="Word set">${sets}</div>
    ${garden ? '<p class="small">Mi jardín: your plants, thirsty ones first. A right zap waters it 💧</p>' : '<p class="small">Plant 6 words in El Jardín to play with your own garden.</p>'}
    <button class="chipbtn" data-act="auto" aria-pressed="${auto}">🔊 Auto voice: ${auto ? 'on' : 'off'}</button>
    <button class="go" data-act="go">✦ ${mode === 'over' ? 'Jugar otra vez' : 'Empezar'}</button>`;
  $('.stars-over').hidden = false;
  hud();
}

function start(): void {
  pairs = pairsFor(state(), set);
  hearts = 3; score = 0; combo = 0; speed = 38; grown = 0; spawnT = 0;
  meteors = []; sparks = []; beams = []; msg = null; watered = new Set();
  mode = 'play';
  $('.stars-over').hidden = true;
  $('.stars-ask').hidden = false;
  for (let i = 0; i < 3; i++) setTimeout(() => mode === 'play' && spawn(), i * 700);
  pickTarget();
  hud();
}

function over(): void {
  const S = state();
  lastXP = finishStars(S, score);
  commit();
  sfx('done');
  mode = 'over';
  const title = score >= 15 ? '¡Increíble!' : score >= 7 ? '¡Muy bien!' : '¡Otra vez!';
  const water = grown ? ` ${grown} plant${grown === 1 ? '' : 's'} watered 💧` : '';
  menu(title, `You zapped ${score} word${score === 1 ? '' : 's'}. +${lastXP} XP.${water}`);
}

function hud(): void {
  $('.hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(3 - hearts);
  $('.score').textContent = String(score);
  $('.combo').textContent = combo >= 3 ? `✦ combo ×${combo}` : '';
}

// ---- game ----

function pickTarget(): void {
  target = rnd(pairs);
  $('.lbl').textContent = set === 'numbers' ? 'Zap the number' : 'Zap the Spanish for';
  $('.txt').textContent = target[0];
  if (!meteors.some((m) => m.es === target![1] && !m.dead)) spawn(target[1]);
  if (state().settings.starsAuto) say(target[1]);
}

function spawn(force?: string): void {
  const es = force || rnd(pairs)[1];
  ctx.font = `${Math.round(P * 5.5)}px ${FONT}`;
  const w = Math.min(W - P * 4, Math.max(ctx.measureText(es).width + P * 8, P * 24));
  const x = P * 2 + Math.random() * Math.max(1, W - w - P * 4);
  meteors.push({ es, x, y: -P * 14, w, h: P * 10, vy: speed * (0.75 + Math.random() * 0.5), hue: rnd(HUES), dead: false });
}

function burst(x: number, y: number, c: string, n = 14): void {
  if (reduce()) n = 4;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.4, c: Math.random() < 0.5 ? c : '#fff' });
  }
}

function tap(x: number, y: number): void {
  if (mode !== 'play' || !target) return;
  const hit = meteors.find((m) => !m.dead && x >= m.x - P * 2 && x <= m.x + m.w + P * 2 && y >= m.y - P * 3 && y <= m.y + m.h + P * 3);
  if (!hit) return;
  const cx = hit.x + hit.w / 2, cy = hit.y + hit.h / 2;
  beams.push({ x: cx, y: cy, life: 0.25 });
  hit.dead = true;
  const S = state();
  if (hit.es === target[1]) {
    combo++;
    score++;
    burst(cx, cy, hit.hue, 18);
    const grew = zap(S, target, watered);
    if (grew) grown++;
    sfx(grew ? 'grow' : 'good');
    say(hit.es);
    msg = { text: grew ? '¡Sí! 💧' : combo >= 3 ? `¡Combo ×${combo}!` : '¡Sí!', x: cx, y: cy, life: 0.8 };
    speed = Math.min(110, speed + 2.2);
    if (grew) commit();
    // let the voice finish the word before the next one speaks
    target = null;
    setTimeout(() => mode === 'play' && pickTarget(), state().settings.starsAuto ? 450 : 0);
  } else {
    combo = 0;
    miss(S);
    burst(cx, cy, '#d9c6f7', 8);
    sfx('bad');
    msg = { text: hit.es, x: cx, y: cy, life: 0.8, wrong: true };
    if (!meteors.some((m) => m.es === target![1] && !m.dead)) spawn(target[1]);
  }
  hud();
}

function landed(m: Meteor): void {
  m.dead = true;
  if (!target || m.es !== target[1]) return;
  hearts--;
  combo = 0;
  shake = 0.3;
  miss(state());
  sfx('bad');
  msg = { text: `${target[1]} = ${target[0]}`, x: W / 2, y: H * 0.7, life: 1.4, wrong: true };
  burst(m.x + m.w / 2, H * 0.86, '#e8607a', 10);
  hud();
  if (hearts <= 0) over();
  else pickTarget();
}

function frame(now: number): void {
  if (!starsOpen()) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const still = reduce();
  // sky: navy fading to a pink dusk at the bottom, dithered between bands
  ctx.fillStyle = '#0b0a3a';
  ctx.fillRect(0, 0, W, H);
  const bands = ['#0b0a3a', '#1b1060', '#3d2a8a', '#6b4fa8', '#b399f5', '#fb9ecd'];
  const bh = (H * 0.32) / bands.length;
  bands.forEach((c, i) => {
    const y0 = H * 0.68 + i * bh;
    ctx.fillStyle = c;
    ctx.fillRect(0, snap(y0), W, snap(bh) + P);
    if (i) for (let x = 0; x < W; x += P * 2) ctx.fillRect(x + (i % 2) * P, snap(y0) - P, P, P);
  });
  for (const s of stars) {
    s.tw += dt * (still ? 0 : 2);
    if (Math.sin(s.tw) > -0.3) px(s.x, s.y, (P * s.s) / 2 + P / 2, (P * s.s) / 2 + P / 2, s.c);
  }
  // crescent moon
  const mx = W - P * 18, my = P * 26;
  for (let y = -6; y <= 6; y++)
    for (let x = -6; x <= 6; x++)
      if (x * x + y * y <= 36 && (x - 3) * (x - 3) + (y + 2) * (y + 2) > 22) px(mx + x * P, my + y * P, P, P, '#f6e4f8');

  if (mode === 'play') {
    spawnT += dt;
    const every = Math.max(0.9, 2.1 - score * 0.06);
    if (spawnT > every && meteors.filter((m) => !m.dead).length < 6) {
      spawnT = 0;
      spawn();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(P * 5)}px ${FONT}`;
  for (const m of meteors) {
    if (m.dead) continue;
    if (mode === 'play') m.y += m.vy * dt;
    for (let k = 1; k <= 4; k++) px(m.x + m.w / 2 - P / 2 + (k % 2 ? P : -P), m.y - k * P * 2.2, P, P, k < 3 ? m.hue : '#ffffff');
    px(m.x, m.y, m.w, m.h, '#2a1438');
    px(m.x + P, m.y + P, m.w - P * 2, m.h - P * 2, '#f6e4f8');
    px(m.x + P, m.y + P, m.w - P * 2, P * 2, m.hue);
    px(m.x + P, m.y + P, P * 2, m.h - P * 2, m.hue);
    ctx.fillStyle = '#6b4fa8';
    ctx.fillText(m.es, Math.round(m.x + m.w / 2 + P), Math.round(m.y + m.h / 2 + P * 0.6));
    if (mode === 'play' && m.y > H * 0.86) landed(m);
  }
  meteors = meteors.filter((m) => !m.dead);

  // the little star companion who fires the beams
  const cx = W / 2, cy = H * 0.9 - P * 16;
  const bob = still ? 0 : Math.round(Math.sin(now / 400)) * P;
  for (let y = -4; y <= 4; y++)
    for (let x = -9; x <= 9; x++) {
      const ax = Math.abs(x), ay = y + 4;
      if ((ay >= 3 && ay <= 5 && ax <= 9 - (ay - 3) * 2) || (ay < 3 && ax <= ay) || (ay > 5 && ax >= 3 && ax <= 4 + (ay - 6)))
        px(cx + x * P, cy + P * 10 + y * P + bob, P, P, '#ffe066');
    }
  for (let y = -5; y <= 5; y++)
    for (let x = -6; x <= 6; x++) if ((x * x) / 36 + (y * y) / 25 <= 1) px(cx + x * P, cy + y * P + bob, P, P, x > 3 ? '#d9c6f7' : '#fff7fc');
  px(cx - P * 3, cy - P + bob, P, P, '#6b4fa8');
  px(cx + P * 2, cy - P + bob, P, P, '#6b4fa8');
  px(cx - P * 4, cy + P + bob, P, P, '#fb9ecd');
  px(cx + P * 3, cy + P + bob, P, P, '#fb9ecd');
  px(cx, cy - P * 7 + bob, P, P * 2, '#ffe066');
  px(cx - P, cy - P * 6 + bob, P * 3, P, '#ffe066');

  for (const b of beams) {
    b.life -= dt;
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      px(cx + (b.x - cx) * f, cy - P * 7 + (b.y - (cy - P * 7)) * f, P, P, i % 2 ? '#ffe066' : '#fff');
    }
  }
  beams = beams.filter((b) => b.life > 0);

  for (const s of sparks) {
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 140 * dt;
    if (s.life > 0) px(s.x, s.y, P, P, s.c);
  }
  sparks = sparks.filter((s) => s.life > 0);

  if (msg) {
    msg.life -= dt;
    msg.y -= 30 * dt;
    ctx.font = `bold ${Math.round(P * 6)}px ${FONT}`;
    ctx.fillStyle = '#6b4fa8';
    ctx.fillText(msg.text, msg.x + 2, msg.y + 2);
    ctx.fillStyle = msg.wrong ? '#fcb4db' : '#ffe066';
    ctx.fillText(msg.text, msg.x, msg.y);
    if (msg.life <= 0) msg = null;
  }

  if (shake > 0) {
    shake -= dt;
    cv.style.transform = still ? '' : `translate(${(Math.random() - 0.5) * 8}px, 0)`;
  } else cv.style.transform = '';
  raf = requestAnimationFrame(frame);
}

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
  if (!btn || btn.disabled) return;
  const S = state();
  switch (btn.dataset.act) {
    case 'close':
      sfx('tap');
      return closeEstrellas();
    case 'say':
      if (target) say(target[1]);
      return;
    case 'set':
      set = btn.dataset.set as StarSet;
      sfx('tap');
      layer!.querySelectorAll('[data-act="set"]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
      return;
    case 'auto':
      S.settings.starsAuto = !S.settings.starsAuto;
      commit();
      sfx('tap');
      btn.setAttribute('aria-pressed', String(S.settings.starsAuto));
      btn.textContent = `🔊 Auto voice: ${S.settings.starsAuto ? 'on' : 'off'}`;
      return;
    case 'go':
      sfx('door');
      return start();
  }
}

// for automated tests
if (typeof window !== 'undefined')
  Object.assign(window, {
    __estrellas: () => ({ mode, set, score, hearts, target, meteors: meteors.map((m) => ({ es: m.es, x: m.x + m.w / 2, y: m.y + m.h / 2 })) }),
  });
