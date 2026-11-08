// Smoke test: builds must already exist (npm run build).
// Opens the game at iPhone size, checks it draws, taps a door, then checks offline mode.
import { preview } from 'vite';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 4179;
const URL = `http://localhost:${PORT}/spanish-game/`;
const OUT = process.env.SMOKE_OUT || 'test-results';
mkdirSync(OUT, { recursive: true });

const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'warn' });
const fail = (msg) => { console.error('FAIL:', msg); process.exit(1); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const g = window.__game, c = g.canvas, r = c.getBoundingClientRect();
  return { w: g.registry.get('W'), h: g.registry.get('H'), zoom: g.registry.get('zoom'), cssW: r.width, cssH: r.height, font: document.fonts.check('8px "Pixelify Sans"') };
});
console.log('game size', info);
if (info.w < 180 || info.h < 320) fail('game smaller than 180x320');
if (!info.font) fail('pixel font not loaded');
await page.screenshot({ path: `${OUT}/cielo.png` });

// settings: tap the gear, check the panel, change accent, test voice, back up, restore
const box = await page.locator("canvas").boundingBox();
const unit = box.width / info.w; // css px per game pixel
await page.mouse.click(box.x + (info.w - 14) * unit, box.y + 14 * unit);
await page.waitForSelector('#settings .panel', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/settings.png` });
await page.click('[data-act="accent"][data-v="co"]');
const accent = await page.evaluate(() => window.__state().accent);
if (accent !== 'co') fail('accent did not change');
await page.click('[data-act="test"]');
await page.fill('#set-name', 'Shay');
await page.locator('#set-name').blur();
const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="backup"]')]);
const backupPath = `${OUT}/${download.suggestedFilename()}`;
await download.saveAs(backupPath);
// change something, then restore the backup and check it came back
await page.click('[data-act="accent"][data-v="mx"]');
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-act="restore"]')]);
await chooser.setFiles(backupPath);
await page.waitForFunction(() => window.__state().accent === 'co', null, { timeout: 5000 });
const restoredName = await page.evaluate(() => window.__state().name);
if (restoredName !== 'Shay') fail('restore lost the name');
// saved across reloads
await page.click('[data-act="close"]');
await page.waitForTimeout(500);
await page.reload();
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
const kept = await page.evaluate(() => window.__state().name);
if (kept !== 'Shay') fail('progress was not saved across reload');
console.log('settings, backup, restore, save OK');

// ---- El Jardín ----
const tapGame = async (gx, gy) => {
  const b = await page.locator('canvas').boundingBox();
  const u = b.width / info.w;
  await page.mouse.click(b.x + gx * u, b.y + gy * u);
};
const W = info.w, H = info.h;
const isActive = (k) => page.evaluate((k) => window.__game.scene.isActive(k), k);
// garden door: centre of the island, just above the grass line
await tapGame(W / 2, Math.round(H * 0.44) - 26);
await page.waitForFunction(() => window.__game.scene.isActive('JardinHud'), null, { timeout: 5000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/jardin-empty.png` });
// bottom buttons: Regar | Sembrar | Focus
const bw = Math.floor((W - 16) / 3);
const btnY = H - 46 + 8 + 13;
const btnX = (i) => 4 * (i + 1) + bw * i + bw / 2;
await tapGame(btnX(1), btnY); // Sembrar
await page.waitForSelector('#session [data-act="learnnext"]', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/sembrar.png` });
for (let i = 0; i < 5; i++) await page.click('#session [data-act="learnnext"]');
for (let i = 0; i < 5; i++) {
  await page.locator('#session [data-act="pick"]').first().click({ timeout: 4000 }).catch(async (e) => {
    console.log('ITER', i, (await page.locator('#session').innerHTML()).slice(0, 900));
    throw e;
  });
  await page.click('#session [data-act="next"]');
}
await page.waitForSelector('#session [data-act="close"]');
await page.click('#session .wide[data-act="close"]');
const planted = await page.evaluate(() => Object.keys(window.__state().cards).length);
if (planted !== 5) fail('expected 5 planted seeds, got ' + planted);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/jardin-planted.png` });

// travel 3 days ahead so every plant is thirsty, then water them with flashcards
await page.goto(URL + '?day=3');
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(300);
await tapGame(W / 2, Math.round(H * 0.44) - 26);
await page.waitForFunction(() => window.__game.scene.isActive('JardinHud'), null, { timeout: 5000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/jardin-thirsty.png` });
await tapGame(btnX(0), btnY); // Regar
await page.waitForSelector('#session [data-act="mode"]');
await page.click('#session [data-act="mode"][data-m="flash"]');
await page.click('#session [data-act="start"]');
const before = await page.evaluate(() => Object.values(window.__state().cards).map((c) => c.box));
for (let i = 0; i < 20; i++) {
  if (!(await page.locator('#session [data-act="reveal"]').count())) break;
  await page.click('#session [data-act="reveal"]');
  await page.click('#session [data-act="rate"][data-r="good"]');
}
await page.waitForSelector('#session .wide[data-act="close"]');
await page.screenshot({ path: `${OUT}/regar-done.png` });
await page.click('#session .wide[data-act="close"]');
const after = await page.evaluate(() => Object.values(window.__state().cards).map((c) => c.box));
if (!(after.reduce((a, b) => a + b, 0) > before.reduce((a, b) => a + b, 0))) fail('watering did not grow plants');
// typed answer with the accent row
const S2 = await page.evaluate(() => { const s = window.__state(); for (const c of Object.values(s.cards)) c.due = '2000-01-01'; return 1; });
void S2;
await tapGame(btnX(0), btnY);
await page.click('#session [data-act="mode"][data-m="rwd"]');
await page.click('#session [data-act="start"]');
await page.fill('#answer', 'hola');
await page.click('#session .accents button >> nth=0');
const typed = await page.inputValue('#answer');
if (!typed.endsWith('á')) fail('accent button did not type');
await page.click('#session [data-act="check"]');
await page.waitForSelector('#session .feedback');
await page.screenshot({ path: `${OUT}/typed.png` });
await page.click('#session [data-act="close"]');
// focus opens
await tapGame(btnX(2), btnY);
await page.waitForSelector('#session h2');
await page.click('#session [data-act="close"]');
// tap a plant for its info card
await page.waitForTimeout(300);
const plantPos = await page.evaluate(() => {
  const sc = window.__game.scene.getScene('Jardin');
  const c = sc.children.list.find((o) => o.getData && o.getData('id'));
  const z = 2; // garden draws at 2x
  return c ? { x: c.x * z, y: (c.y - 10 - sc.cameras.main.scrollY) * z } : null;
});
if (!plantPos) fail('no plants on screen');
await tapGame(plantPos.x, plantPos.y);
await page.waitForSelector('#session .big', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/plant-info.png` });
await page.click('#session [data-act="close"]');
console.log('jardín: plant, time travel, water, typed, focus, info OK');

// ---- El Cielo: Hoy, phrase of the day, daily route, Progreso, locked door ----
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/cielo-hub.png` });
const bw2 = Math.floor((W - 18) / 2);
await tapGame(6 + bw2 / 2, H - 32 + 12); // Hoy
await page.waitForSelector('#panel [data-act="phrase"]', { timeout: 5000 });
const xp0 = await page.evaluate(() => window.__state().xp);
await page.click('#panel [data-act="phrase"] >> nth=0');
const xp1 = await page.evaluate(() => window.__state().xp);
if (xp1 !== xp0 + 2) fail('phrase of the day did not give 2 XP');
await page.click('#panel [data-act="sounds"]');
await page.screenshot({ path: `${OUT}/hoy.png`, fullPage: false });
await page.click('#panel [data-act="task"][data-id="focus"]');
await page.waitForFunction(() => window.__game.scene.isActive('JardinHud'), null, { timeout: 5000 });
await page.waitForSelector('#session h2', { timeout: 5000 });
await page.click('#session [data-act="close"]');
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(300);
await tapGame(6 * 2 + bw2 + bw2 / 2, H - 32 + 12); // Progreso
await page.waitForSelector('#panel .chart', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/progreso.png` });
await page.click('#panel [data-act="close"]');
// a locked door now: El Café
await tapGame(Math.round(W * 0.72), Math.round(H * 0.74) - 38 / 2 + 14 - 8);
await page.waitForTimeout(300);
if (!(await isActive('Cielo'))) fail('locked door left El Cielo');
console.log('cielo: hoy, phrase XP, route, progreso, locked door OK');

// ---- La Clínica: play a full patient visit with the right answers ----
await tapGame(W / 2 + 36, Math.round(H * 0.44) - 26);
await page.waitForFunction(() => window.__game.scene.isActive('Clinica'), null, { timeout: 5000 });
await page.waitForSelector('#clinic [data-act="go"]', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/clinica-menu.png` });
await page.click('#clinic [data-act="go"][data-n="1"]');
await page.waitForTimeout(900);
for (let step = 0; step < 10; step++) {
  const c = await page.evaluate(() => window.__clinic());
  const { p, t } = c;
  if (t.kind === 'checkin') {
    for (const [f, v] of [['name', p.name], ['day', p.day], ['mo', p.mo], ['year', p.year]]) await page.click(`#clinic [data-act="pick"][data-f="${f}"][data-v="${v}"]`);
    await page.screenshot({ path: `${OUT}/clinica-checkin.png` });
    await page.click('#clinic [data-act="submit"]');
  } else if (t.kind === 'sym') {
    if (p.body[3] === 'back') await page.click('#clinic [data-act="turn"]');
    const pos = await page.evaluate((part) => {
      const sc = window.__game.scene.getScene('Clinica');
      const HOT = { cabeza: [20, 9], garganta: [20, 19], pecho: [20, 26], 'estómago': [20, 39], brazo: [7, 34], pierna: [15, 62], espalda: [20, 33] };
      const [hx, hy] = HOT[part];
      return { x: sc.pat.x - sc.pat.width / 2 + hx, y: sc.pat.y + hy };
    }, p.body[0]);
    await tapGame(pos.x, pos.y);
    await page.waitForTimeout(150);
    await page.click(`#clinic [data-act="pick"][data-f="sym"][data-v="${p.sym[0]}"]`);
    await page.click(`#clinic [data-act="pick"][data-f="days"][data-v="${p.days}"]`);
    await page.screenshot({ path: `${OUT}/clinica-sym.png` });
    await page.click('#clinic [data-act="submit"]');
  } else if (t.kind === 'chips') {
    await page.click(`#clinic [data-act="chipv"][data-v="${t.correct}"]`);
  } else {
    if (t.kind === 'vital') await page.click('#clinic [data-act="tool"]');
    const i = t.opts.findIndex((o) => o.ok);
    await page.click(`#clinic [data-act="opt"][data-i="${i}"]`);
    if (t.id === 'cmd1') await page.screenshot({ path: `${OUT}/clinica-cmd.png` });
  }
  const bad = await page.locator('#clinic .feedback.no').count();
  if (bad) fail(`clinic step ${t.id} was marked wrong`);
  await page.click('#clinic [data-act="next"]');
  await page.waitForTimeout(120);
}
await page.waitForSelector('#clinic [data-act="nextp"]', { timeout: 5000 });
await page.click('#clinic [data-act="nextp"]');
await page.waitForSelector('#clinic [data-act="menu"]');
await page.screenshot({ path: `${OUT}/clinica-end.png` });
const clin = await page.evaluate(() => window.__state().clin);
if (clin.shifts !== 1 || clin.stars !== 5) fail('clinic shift not recorded: ' + JSON.stringify(clin));
console.log('clínica: full visit, 5 stars OK');

// ---- La Biblioteca ----
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(400);
await tapGame(Math.round(W * 0.27) - 15, Math.round(H * 0.66) - 12);
await page.waitForFunction(() => window.__game.scene.isActive('Biblioteca'), null, { timeout: 5000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/biblioteca.png` });
const shelfY = Math.round(H * 0.42);
const bookX = Math.round(W / 2 - (6 * 18 + 5 * 4) / 2) + 9;
await tapGame(bookX, shelfY - 15);
await page.waitForSelector('#reader .sent', { timeout: 5000 });
await page.click('#reader .w >> nth=1');
await page.waitForSelector('#reader .wordcard');
await page.screenshot({ path: `${OUT}/reader-word.png` });
const canSave = await page.locator('#reader [data-act="savew"]').count();
if (canSave) await page.click('#reader [data-act="savew"]');
await page.click('#reader [data-act="wclose"]');
await page.click('#reader [data-act="alltr"]');
await page.click('#reader [data-act="ssave"] >> nth=0');
const saved = await page.evaluate(() => Object.keys(window.__state().cards).filter((k) => k.startsWith('w:')).length);
if (saved < 1) fail('saving from a story did not plant a seed');
await page.click('#reader [data-act="finish"]');
await page.waitForSelector('#reader [data-act="order"]');
if (await page.locator('#reader [data-act="recapadd"]').count()) await page.click('#reader [data-act="recapadd"]');
await page.click('#reader [data-act="order"]');
await page.waitForSelector('#reader [data-act="place"]');
for (let n = 0; n < 5; n++) await page.click(`#reader [data-act="place"][data-id="${n}"]`);
await page.click('#reader [data-act="ocheck"]');
await page.waitForSelector('#reader .feedback.ok', { timeout: 3000 });
await page.screenshot({ path: `${OUT}/order.png` });
await page.click('#reader [data-act="close"] >> nth=0');
// immersion mode hides the text until you ask
const bwL = Math.floor((W - 18) / 2);
await tapGame(6 + bwL / 2, H - 32 + 12);
await page.waitForFunction(() => window.__state().imm === true);
await page.waitForTimeout(200);
await tapGame(bookX + 22, shelfY - 15);
await page.waitForSelector('#reader .sent p.hidden', { timeout: 5000 });
await page.click('#reader [data-act="rev"] >> nth=0');
await page.click('#reader .w >> nth=0');
await page.waitForSelector('#reader [data-act="wmean"]');
await page.screenshot({ path: `${OUT}/reader-imm.png` });
await page.click('#reader [data-act="close"] >> nth=0');
const read = await page.evaluate(() => Object.keys(window.__state().stories).length);
if (read < 1) fail('story not counted as read');
console.log('biblioteca: words, save, finish, recap, order, immersion OK');

// ---- La Isla de Inmersión: one round of every activity ----
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(400);
await tapGame(Math.round(W * 0.27) + 15, Math.round(H * 0.66) - 12);
await page.waitForFunction(() => window.__game.scene.isActive('Isla'), null, { timeout: 5000 });
await page.waitForSelector('#isla [data-act="start"]', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/isla-menu.png` });
await page.click('#isla [data-act="start"]');
const kinds = [];
for (let n = 0; n < 10; n++) {
  const { it } = await page.evaluate(() => window.__isla());
  kinds.push(it.k);
  if (it.k === 'img' || it.k === 'oye' || it.k === 'dial') {
    const opts = it.wOpts || it.lOpts || it.dOpts;
    const i = opts.findIndex((o) => (it.k === 'img' ? o.id === it.w.id : it.k === 'oye' ? o.es === it.line.es : o[1] === it.b[1]));
    await page.click(`#isla [data-act="pick"][data-i="${i}"]`);
  } else if (it.k === 'dicta') {
    await page.fill('#isin', it.line.es);
    await page.click('#isla [data-act="check"]');
  } else if (it.k === 'orden') {
    for (let k = 0; k < it.sents.length; k++) await page.click(`#isla [data-act="place"][data-id="${k}"]`);
    await page.click('#isla [data-act="check"]');
  } else if (it.k === 'habla') {
    await page.click('#isla [data-act="spoke"]');
  } else {
    await page.fill('#isin', 'Me siento cansada porque trabajé mucho, pero estoy feliz hoy.');
    await page.screenshot({ path: `${OUT}/isla-escribe.png` });
    await page.click('#isla [data-act="check"]');
  }
  if (n === 1) await page.screenshot({ path: `${OUT}/isla-oye.png` });
  if (await page.locator('#isla .feedback.no').count()) fail(`immersion ${it.k} marked wrong`);
  await page.click('#isla [data-act="next"]');
}
await page.click('#isla [data-act="end"]');
await page.waitForSelector('#isla [data-act="menu"]');
await page.screenshot({ path: `${OUT}/isla-end.png` });
const imm = await page.evaluate(() => window.__state().immData);
if (imm.sess !== 1 || imm.right !== 10) fail('immersion session not recorded: ' + JSON.stringify(imm));
console.log('isla: ' + [...new Set(kinds)].join(',') + ' OK');

// ---- El Observatorio ----
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(400);
await tapGame(W / 2 - 36, Math.round(H * 0.44) - 26);
await page.waitForFunction(() => window.__game.scene.isActive('Observatorio'), null, { timeout: 5000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/observatorio.png` });
const STARS = { conj: [0.22, 0.16], qw: [0.4, 0.34], armar: [0.54, 0.8], sonidos: [0.76, 0.94], fino: [0.16, 0.86] };
const tapStar = async (k) => {
  const [fx, fy] = STARS[k];
  const dh = H - 40 - 34 - 28;
  await tapGame(Math.round(10 + fx * (W - 20)), Math.round(34 + fy * dh) + 2);
  await page.waitForSelector('#grammar .panel', { timeout: 5000 });
};
// Conjugar: pick tener, build it with hints
await tapStar('conj');
await page.fill('#cjq', 'ten');
await page.click('#grammar [data-act="cjpick"][data-es="tener"]');
await page.click('#grammar [data-act="cjt"][data-t="fut"]');
await page.screenshot({ path: `${OUT}/conjugar.png` });
await page.click('#grammar [data-act="cjbuild"]');
for (let i = 0; i < 8; i++) {
  const n = await page.evaluate(() => window.__grammar().items[window.__grammar().i].ans.length);
  for (let k = 0; k < n; k++) await page.click('#grammar [data-act="bhint"]');
  await page.click('#grammar [data-act="bcheck"]');
  if (await page.locator('#grammar .feedback.no').count()) fail('verb build marked wrong');
  await page.click('#grammar [data-act="bnext"]');
}
await page.waitForSelector('#grammar [data-act="again"]');
await page.click('#grammar [data-act="qback"]');
await page.click('#grammar [data-act="close"]');
// Preguntas drill: answer everything right
await tapStar('qw');
await page.click('#grammar [data-act="drill"]');
for (let i = 0; i < 12; i++) {
  const v = await page.evaluate(() => window.__grammar());
  if (v.k !== 'quiz') break;
  const it = v.items[v.i];
  await page.click(`#grammar [data-act="qopt"][data-i="${it.opts.indexOf(it.a)}"]`);
  if (i === 0) await page.screenshot({ path: `${OUT}/drill.png` });
  await page.click('#grammar [data-act="qnext"]');
}
await page.waitForSelector('#grammar [data-act="again"]');
await page.click('#grammar [data-act="qback"]');
await page.click('#grammar [data-act="close"]');
// Armar frases: one sentence with hints
await tapStar('armar');
await page.click('#grammar [data-act="bstart"][data-k="frase"]');
const n0 = await page.evaluate(() => window.__grammar().items[0].ans.length);
for (let k = 0; k < n0; k++) await page.click('#grammar [data-act="bhint"]');
await page.click('#grammar [data-act="bcheck"]');
await page.screenshot({ path: `${OUT}/armar.png` });
await page.click('#grammar [data-act="qback"]');
await page.click('#grammar [data-act="close"]');
// Sonidos page and Oído fino
await tapStar('sonidos');
await page.screenshot({ path: `${OUT}/sonidos.png` });
await page.click('#grammar [data-act="tofino"]');
for (let i = 0; i < 10; i++) {
  const v = await page.evaluate(() => window.__grammar());
  await page.click(`#grammar [data-act="fopt"][data-k="${v.items[v.i].t}"]`);
  await page.click('#grammar [data-act="fnext"]');
}
await page.waitForSelector('#grammar [data-act="again"]');
await page.click('#grammar [data-act="qback"]');
await page.click('#grammar [data-act="close"]');
// Pensar: a twin-word lesson
const STAR_P = [0.9, 0.47];
{
  const dh = H - 40 - 34 - 28;
  await tapGame(Math.round(10 + STAR_P[0] * (W - 20)), Math.round(34 + STAR_P[1] * dh) + 2);
  await page.waitForSelector('#grammar .panel', { timeout: 5000 });
}
await page.click('#grammar [data-act="sub"][data-s="g-clinica"]');
await page.screenshot({ path: `${OUT}/pensar.png` });
await page.click('#grammar [data-act="think"]');
for (let i = 0; i < 10; i++) {
  await page.click('#grammar [data-act="tshow"]');
  await page.click('#grammar [data-act="tnext"][data-r="1"]');
}
await page.waitForSelector('#grammar [data-act="again"]');
await page.click('#grammar [data-act="qback"]');
await page.click('#grammar [data-act="secback"]');
await page.click('#grammar [data-act="close"]');
const mods = await page.evaluate(() => Object.keys(window.__state().mod));
for (const k of ['vrb', 'g_q', 'bld', 'fino', 'think']) if (!mods.includes(k)) fail('observatorio skill not recorded: ' + k);
console.log('observatorio: conjugar build, drill, armar, sonidos, oído fino OK');

// ---- El Duelo: win the first duel with right answers ----
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
await page.waitForTimeout(400);
await tapGame(Math.round(W * 0.72) - 24, Math.round(H * 0.74) - 13);
await page.waitForFunction(() => window.__game.scene.isActive('Duelo'), null, { timeout: 5000 });
await page.waitForSelector('#duel [data-act="go"]', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/duelo-map.png` });
await page.click('#duel [data-act="go"][data-i="0"]');
let shotHand = false, shotQ = false;
for (let turn = 0; turn < 20; turn++) {
  const st = await page.evaluate(() => window.__duel().stage);
  if (st !== 'battle') break;
  if (!shotHand) { await page.screenshot({ path: `${OUT}/duelo-hand.png` }); shotHand = true; }
  const hand = await page.evaluate(() => window.__duel().b.hand.map((c) => c.used));
  for (let i = 0; i < hand.length; i++) {
    if (hand[i]) continue;
    await page.click(`#duel [data-act="play"][data-i="${i}"]`);
    const { b } = await page.evaluate(() => window.__duel());
    const ch = b.ch, c = b.hand[ch.i];
    if (ch.k === 'mc') await page.click(`#duel [data-act="opt"][data-i="${ch.opts.indexOf(c.w.en)}"]`);
    else if (ch.k === 'ear') await page.click(`#duel [data-act="opt"][data-i="${ch.pics.findIndex((p) => p.id === c.id)}"]`);
    else {
      for (let k = 0; k < ch.tokens.length; k++) await page.click('#duel [data-act="hint"]');
      await page.click('#duel [data-act="cast"]');
    }
    if (!shotQ) { await page.screenshot({ path: `${OUT}/duelo-q.png` }); shotQ = true; }
    await page.click('#duel [data-act="cont"]');
    if ((await page.evaluate(() => window.__duel().stage)) !== 'battle') break;
  }
  if ((await page.evaluate(() => window.__duel().stage)) !== 'battle') break;
  await page.click('#duel [data-act="endturn"]');
}
await page.waitForSelector('#duel [data-act="map"]', { timeout: 5000 });
await page.screenshot({ path: `${OUT}/duelo-win.png` });
const game = await page.evaluate(() => window.__state().game);
if (game.wins !== 1 || game.cleared !== 1) fail('duel not won: ' + JSON.stringify(game));
console.log('duelo: first duel won OK');
await page.goto(URL);
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });

// offline: wait for the service worker, then reload with the network off
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 });
await ctx.setOffline(true);
await page.reload();
await page.waitForFunction(() => window.__game?.scene.isActive('Cielo'), null, { timeout: 15000 });
console.log('offline reload OK');
await ctx.setOffline(false);

if (errors.length) fail('console errors: ' + errors.join(' | '));
await browser.close();
await server.close();
console.log('SMOKE OK');
process.exit(0);
