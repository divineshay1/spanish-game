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
await tapGame(W / 2, Math.round(H * 0.6) - 64 / 2 + 14 - 8);
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
await tapGame(W / 2, Math.round(H * 0.6) - 64 / 2 + 14 - 8);
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
