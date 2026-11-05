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

// tap the garden door (center of the island) and check a message appears
const tapped = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Cielo');
  const before = s.children.list.length;
  return { before };
});
const box = await page.locator('canvas').boundingBox();
const doorY = box.y + box.height * 0.6 - (64 / 2 - 14 + 8) * (box.height / info.h);
await page.mouse.click(box.x + box.width / 2, doorY);
await page.waitForTimeout(150);
const after = await page.evaluate(() => window.__game.scene.getScene('Cielo').children.list.length);
if (after <= tapped.before) fail('tapping the garden door did nothing');
await page.screenshot({ path: `${OUT}/cielo-door.png` });

// settings: tap the gear, check the panel, change accent, test voice, back up, restore
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
