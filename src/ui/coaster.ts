/**
 * La Montaña Rusa: a full-screen 10-word ride opened from El Jardín.
 * Right answer: the cart rolls to the next flag with sparkles.
 * Wrong answer: Brote wobbles; the cart never rolls back and the word returns.
 */
import { state, commit } from '../state/store';
import { speak, stopSpeaking } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { rideWords, choices, rideRight, rideMiss, finishRide, type RideWord } from '../engine/coaster';
import { CoasterWorld, drawRider, seeded, type Face } from './coasterArt';
import { dayKey } from '../engine/clock';
import { shield } from './shield';
import type { SessionResult } from './session';

let layer: HTMLDivElement | null = null;
let cv: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let world: CoasterWorld;
const rider = document.createElement('canvas');
rider.width = 48;
rider.height = 52;
const rc = rider.getContext('2d')!;
let raf = 0;
let onClose: ((r: SessionResult) => void) | null = null;

let ride: RideWord[] = [], queue: RideWord[] = [], cur: RideWord | null = null;
let mode: 'menu' | 'play' | 'end' = 'menu';
let stopIx = 0, dist = 0, from = 0, to = 0, moveT0 = 0, moving = false, wobble = 0, camX = 0, finishT = 0;
let score = 0, streak = 0, right = 0, locked = true, done = false, xpGot = 0;
let watered = new Set<string>(), grew: string[] = [];
let sparks: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
let petals: { x: number; y: number; vy: number; ph: number; c: string }[] = [];
let confetti: { x: number; y: number; vx: number; vy: number; life: number; c: string; sq: boolean }[] = [];
let timers: number[] = [];
let W = 200, H = 140, last = 0;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => layer!.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const reduce = () => state().settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
const say = (t: string) => speak(t, state());
const later = (f: () => void, ms: number) => timers.push(window.setTimeout(f, ms));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const coasterOpen = (): boolean => !!layer && !layer.hidden;

export function openCoaster(cb?: (r: SessionResult) => void): void {
  onClose = cb ?? null;
  if (!layer) build();
  layer!.hidden = false;
  ride = rideWords(state());
  resize();
  menu();
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

function closeCoaster(): void {
  const S = state();
  if (mode === 'play' && right > 0) xpGot = finishRide(S, right, false);
  timers.forEach(clearTimeout);
  timers = [];
  stopSpeaking();
  cancelAnimationFrame(raf);
  commit();
  if (layer) layer.hidden = true;
  const r: SessionResult = { grew: grew.slice(), shrank: [], xp: mode === 'menu' ? 0 : xpGot };
  mode = 'menu';
  onClose?.(r);
}

function build(): void {
  layer = document.createElement('div');
  layer.id = 'coaster';
  layer.className = 'co-layer';
  layer.innerHTML = `
    <div class="co-stage">
      <canvas aria-label="Brote rides a heart-shaped cart along a pastel roller coaster through a cherry blossom valley."></canvas>
      <div class="co-hud">
        <button class="co-x" data-act="close" aria-label="Close">✕</button>
        <span class="co-pill co-score"><span class="heart" aria-hidden="true">♥</span><span class="n">0</span></span>
        <span class="co-pill co-stops">0 / 10</span>
        <button class="co-auto" data-act="auto" aria-pressed="true">🔊 Auto</button>
      </div>
    </div>
    <div class="co-quiz">
      <div class="co-ask"><div class="word"><small>¿Qué significa?</small><b></b></div><button data-act="say" aria-label="Hear the word">🔊</button></div>
      <div class="co-choices"></div>
      <p class="co-note"></p>
    </div>
    <div class="co-over"><div class="box"></div></div>`;
  shield(layer);
  document.body.appendChild(layer);
  cv = $<HTMLCanvasElement>('canvas');
  ctx = cv.getContext('2d')!;
  world = new CoasterWorld(ctx, ride.length || 10);
  layer.addEventListener('click', onClick);
  addEventListener('resize', () => coasterOpen() && resize());
}

function resize(): void {
  const st = $('.co-stage');
  const cw = st.clientWidth, ch = st.clientHeight;
  const S = Math.max(2, Math.round(innerHeight / 300));
  W = Math.ceil(cw / S);
  H = Math.ceil(ch / S);
  cv.width = W;
  cv.height = H;
  cv.style.width = W * S + 'px';
  cv.style.height = H * S + 'px';
  ctx.imageSmoothingEnabled = false;
  world.build(W, H, ride.length);
  dist = world.stops[Math.min(stopIx, ride.length)];
  from = to = dist;
  const rnd = seeded(3);
  petals = Array.from({ length: reduce() ? 10 : 34 }, () => ({ x: rnd() * W, y: rnd() * H, vy: 6 + rnd() * 8, ph: rnd() * 6, c: rnd() < 0.7 ? '#ffc7df' : '#ffffff' }));
}

// ---------- screens ----------

function menu(): void {
  mode = 'menu';
  stopIx = 0;
  dist = from = to = world.stops[0];
  moving = false;
  done = false;
  const S = state();
  const mine = ride.filter((w) => w[2]).length;
  const thirsty = ride.filter((w) => w[2] && S.cards[w[2]].due <= dayKey()).length;
  const words =
    mine >= ride.length ? `Today's ride uses ${ride.length} of your plants${thirsty ? `, and ${thirsty} of them are thirsty` : ''}.`
    : mine ? `Today's ride uses ${mine} of your plants plus ${ride.length - mine} clinic words.`
    : 'Today\'s ride uses clinic starter words. Plant words in El Jardín to ride with your own.';
  overlay(`<h2>La Montaña Rusa</h2>
    <p>Brote rides forward each time you get a word right. A miss makes Brote wobble, but the cart never rolls back. Reach the flower gate to finish.</p>
    <p class="small">${words} Each right answer waters a thirsty plant 💧</p>
    <button class="go" data-act="go">✦ Empezar</button>`);
  setAuto();
  $('.co-quiz').classList.add('idle');
  $('.co-ask b').textContent = ride[0]?.[0] ?? '';
  $('.co-choices').innerHTML = '';
  $('.co-note').textContent = '';
  hud();
}

function overlay(html: string | null): void {
  const o = $('.co-over');
  o.hidden = html === null;
  if (html !== null) $('.co-over .box').innerHTML = html;
}

function start(): void {
  mode = 'play';
  stopIx = 0;
  dist = from = to = world.stops[0];
  moving = false;
  wobble = 0;
  done = false;
  score = 0; streak = 0; right = 0; xpGot = 0;
  sparks = []; confetti = []; watered = new Set(); grew = [];
  queue = [...ride].sort(() => Math.random() - 0.5);
  overlay(null);
  $('.co-quiz').classList.remove('idle');
  hud();
  nextQ();
}

function nextQ(): void {
  if (done || mode !== 'play') return;
  cur = queue.shift()!;
  $('.co-ask b').textContent = cur[0];
  $('.co-ask b').classList.toggle('long', cur[0].length > 16);
  $('.co-choices').innerHTML = choices(state(), cur, ride)
    .map((o) => `<button type="button" data-act="pick" data-a="${esc(o)}">${esc(o)}</button>`)
    .join('');
  $('.co-note').textContent = '';
  locked = false;
  // long phrases can change the card's height: keep the sky filling the space above it
  const st = $('.co-stage');
  if (!moving && Math.abs(st.clientHeight - cv.clientHeight) > 2) resize();
  if (state().settings.starsAuto) say(cur[0]);
}

function answer(btn: HTMLButtonElement): void {
  if (locked || done || !cur) return;
  locked = true;
  const S = state();
  const ok = btn.dataset.a === cur[1];
  layer!.querySelectorAll<HTMLButtonElement>('.co-choices button').forEach((b) => {
    b.disabled = true;
    if (b.dataset.a === cur![1]) b.classList.add('good');
  });
  if (ok) {
    streak++;
    right++;
    const pts = 10 + (streak >= 3 ? 5 : 0);
    score += pts;
    stopIx++;
    from = dist;
    to = world.stops[stopIx];
    moveT0 = performance.now();
    moving = true;
    const p = cartPos();
    burst(p.x, p.y - 18, 14);
    const g = rideRight(S, cur, watered);
    if (g && cur[2]) grew.push(cur[2]);
    commit();
    sfx(g ? 'grow' : 'good');
    say(cur[0]);
    $('.co-note').textContent = g ? `¡Sí! ${cur[0]} = ${cur[1]} · watered 💧` : streak >= 3 ? `¡Racha de ${streak}! +${pts}` : `¡Sí! ${cur[0]} = ${cur[1]}`;
    bump();
    if (stopIx >= ride.length) {
      done = true;
      later(finish, reduce() ? 300 : 1300);
    } else later(nextQ, reduce() ? 700 : 1500);
  } else {
    streak = 0;
    btn.classList.add('bad');
    wobble = 0.7;
    rideMiss(S);
    sfx('bad');
    queue.push(cur); // it comes back before the end of the ride
    $('.co-note').textContent = `Almost. ${cur[0]} = ${cur[1]}. Brote waits for you.`;
    later(nextQ, 1700);
  }
  hud();
}

function finish(): void {
  const S = state();
  xpGot = finishRide(S, right, true);
  commit();
  mode = 'end';
  finishT = performance.now();
  sfx('done');
  const p = cartPos();
  for (let i = 0; i < (reduce() ? 20 : 90); i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, s = 40 + Math.random() * 90;
    confetti.push({ x: p.x - camX, y: p.y - 30, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 2 + Math.random() * 1.5, c: ['#ffe066', '#fb9ecd', '#b399f5', '#a6dcb4', '#ffffff'][i % 5], sq: Math.random() < 0.5 });
  }
  later(() => {
    const water = grew.length ? ` ${grew.length} plant${grew.length === 1 ? '' : 's'} watered 💧` : '';
    overlay(`<h2>¡Lección completa!</h2>
      <p>Brote made it to the flower gate. ♥ ${score} points · +${xpGot} XP.${water}</p>
      <div class="row"><button class="go" data-act="again">✦ Otra vez</button><button data-act="close">Al jardín</button></div>`);
  }, reduce() ? 400 : 2200);
}

function hud(): void {
  $('.co-score .n').textContent = String(score);
  $('.co-stops').textContent = `${stopIx} / ${ride.length}`;
}

function setAuto(): void {
  const on = state().settings.starsAuto;
  $('.co-auto').setAttribute('aria-pressed', String(on));
}

function bump(): void {
  const p = $('.co-score');
  p.classList.remove('bump');
  void p.offsetWidth;
  p.classList.add('bump');
}

function burst(x: number, y: number, n: number): void {
  if (reduce()) n = 5;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 15 + Math.random() * 35;
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: 0.5 + Math.random() * 0.5, c: ['#ffe066', '#ffffff', '#fb9ecd'][i % 3] });
  }
}

function cartPos(): { x: number; y: number } {
  const x = world.xAt(dist);
  return { x, y: world.trackY(x) };
}

// ---------- draw loop ----------

function frame(now: number): void {
  if (!coasterOpen()) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const still = reduce();
  if (moving) {
    const k = Math.min(1, (now - moveT0) / (still ? 300 : 1200));
    dist = from + (to - from) * ease(k);
    if (!still && Math.random() < 0.5) {
      const p = cartPos();
      sparks.push({ x: p.x - 12, y: p.y - 4 - Math.random() * 6, vx: -10 - Math.random() * 10, vy: -5 + Math.random() * 10, life: 0.4, c: Math.random() < 0.5 ? '#ffe066' : '#ffffff' });
    }
    if (k >= 1) {
      moving = false;
      const p = cartPos();
      burst(p.x, p.y - 12, 8);
    }
  }
  if (wobble > 0) wobble -= dt;
  const p = cartPos();
  const target = Math.max(0, Math.min(world.XEND - W, p.x - W * 0.36));
  camX += (target - camX) * Math.min(1, dt * (still ? 20 : 4));

  world.back(camX, now, still, stopIx);

  // the rider, tilted to the slope; wobbles on a miss, hops at the gate
  const slope = Math.atan2(world.trackY(p.x + 2) - world.trackY(p.x - 2), 4);
  let ang = Math.max(-0.55, Math.min(0.55, slope));
  if (wobble > 0 && !still) ang += Math.sin(wobble * 40) * 0.12 * (wobble / 0.7);
  const party = done && !moving;
  const jump = party && !still ? -Math.abs(Math.sin((now - finishT) / 180)) * 6 : 0;
  const face: Face = wobble > 0 ? 'dizzy' : moving || party ? 'happy' : 'calm';
  drawRider(rc, face, now, still);
  ctx.save();
  ctx.translate(Math.round(p.x - camX), Math.round(p.y + jump));
  ctx.rotate(ang);
  ctx.drawImage(rider, -24, -48);
  ctx.restore();
  if (wobble > 0) {
    const bx = Math.round(p.x - camX) + 8, by = Math.round(p.y) - 50;
    world.R(bx - 4, by - 3, 13, 6, '#ffffff');
    world.R(bx - 3, by - 4, 11, 8, '#ffffff');
    world.R(bx - 1, by, 1, 1, '#8f76d9');
    world.R(bx + 2, by, 1, 1, '#8f76d9');
    world.R(bx + 5, by, 1, 1, '#8f76d9');
  }

  for (const s of sparks) {
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 40 * dt;
    if (s.life > 0) world.sparkle(Math.round(s.x - camX), Math.round(s.y), s.c, s.life > 0.45);
  }
  sparks = sparks.filter((s) => s.life > 0);

  world.front(camX);

  for (const pt of petals) {
    pt.y += pt.vy * dt * (still ? 0.4 : 1);
    pt.ph += dt * 2;
    const x = Math.round(pt.x + Math.sin(pt.ph) * 4 - ((camX * 0.3) % W) + W) % W;
    if (pt.y > H + 2) {
      pt.y = -2;
      pt.x = Math.random() * W;
    }
    world.R(x, pt.y, 2, 1, pt.c);
    world.R(x + (Math.sin(pt.ph) > 0 ? 1 : 0), pt.y + 1, 1, 1, '#f39cc4');
  }
  for (const c of confetti) {
    c.life -= dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vy += 60 * dt;
    c.vx *= 0.99;
    if (c.life > 0) {
      if (c.sq) world.R(c.x, c.y, 2, 2, c.c);
      else world.sparkle(Math.round(c.x), Math.round(c.y), c.c);
    }
  }
  confetti = confetti.filter((c) => c.life > 0 && c.y < H + 5);
  raf = requestAnimationFrame(frame);
}

function onClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
  if (!btn || btn.disabled) return;
  const S = state();
  switch (btn.dataset.act) {
    case 'close':
      sfx('tap');
      return closeCoaster();
    case 'say':
      if (cur || ride[0]) say((cur ?? ride[0])[0]);
      return;
    case 'auto':
      S.settings.starsAuto = !S.settings.starsAuto;
      commit();
      setAuto();
      if (S.settings.starsAuto && cur && mode === 'play') say(cur[0]);
      return;
    case 'go':
      sfx('door');
      return start();
    case 'again':
      sfx('door');
      ride = rideWords(state());
      world.build(W, H, ride.length);
      return start();
    case 'pick':
      return answer(btn);
  }
}

// for automated tests
if (typeof window !== 'undefined')
  Object.assign(window, { __coaster: () => ({ mode, stopIx, right, score, cur, n: ride.length, grew: grew.slice() }) });
