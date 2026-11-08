import Phaser from 'phaser';
import { PAL } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { fadeIn } from '../game/transition';
import { state, subscribe } from '../state/store';
import { catalog, type Card, type Family } from '../engine/cards';
import { thirst } from '../engine/srs';
import { dayKey } from '../engine/clock';
import { plantCanvas, plantKey, FAMILY_NAME, PLANT_W, PLANT_H } from '../art/plants';
import { openInfo, type SessionResult } from '../ui/session';
import { skyCanvas } from '../art/sky';
import { cloudLayer } from '../art/clouds';
import { sfx } from '../audio/sfx';

const ORDER: Family[] = ['paciente', 'imagen', 'vocab', 'tarjetas', 'frases', 'raices', 'verbos', 'siete', 'mias'];
const CELL_W = 22;
const CELL_H = 30;
/** the garden is drawn at 2x so plants are easy to see and tap */
export const GARDEN_ZOOM = 2;
export const TOP = 30; // HUD top bar height (HUD pixels)
export const BOTTOM_BAR = 46; // HUD bottom bar height (HUD pixels)
const gTop = Math.ceil(TOP / GARDEN_ZOOM);
const gBottom = Math.ceil(BOTTOM_BAR / GARDEN_ZOOM);

/** El Jardín: every word you learn is a plant. */
export class JardinScene extends Phaser.Scene {
  private plants = new Map<string, Phaser.GameObjects.Container>();
  private worldH = 0;
  private dragY: number | null = null;
  private dragMoved = 0;
  private scrollY = 0;

  constructor() {
    super('Jardin');
  }

  private W = 0;
  private H = 0;

  create(data?: { open?: string }): void {
    const { W, H } = setupView(this, GARDEN_ZOOM);
    this.W = W;
    this.H = H;
    this.plants.clear();
    this.scrollY = 0;

    // fixed backdrop: dusk sky band, then grass
    const skyKey = `garden-sky-${W}x${H}`;
    if (!this.textures.exists(skyKey))
      this.textures.addCanvas(skyKey, skyCanvas(W, H, [[0, PAL.lavender], [0.14, PAL.pink], [0.24, PAL.blush], [0.3, PAL.cream], [1, PAL.cream]]));
    this.add.image(0, 0, skyKey).setOrigin(0).setScrollFactor(0);
    if (!this.textures.exists('cloud-garden'))
      this.textures.addCanvas('cloud-garden', cloudLayer(256, 40, 77, 4, 8, { light: PAL.white, mid: PAL.rose, shade: PAL.lilac, deep: PAL.lavender }));
    const clouds = this.add.tileSprite(0, gTop - 6, W, 40, 'cloud-garden').setOrigin(0).setScrollFactor(0).setAlpha(0.9);
    this.events.on('update', (_t: number, dt: number) => (clouds.tilePositionX += dt * 0.003));
    this.add.image(W - 16, gTop + 4, 'moon').setScrollFactor(0);
    this.add.tileSprite(0, Math.round(H * 0.28), W, H, 'grass').setOrigin(0).setScrollFactor(0);
    // a soft dithered edge where the grass meets the sky
    const edge = this.add.graphics().setScrollFactor(0);
    edge.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.sage).color, 1);
    for (let x = 0; x < W; x += 2) edge.fillRect(x, Math.round(H * 0.28) + ((x / 2) % 2), 1, 1);

    this.layout();
    this.setupScroll();

    this.scene.launch('JardinHud', data);
    this.scene.bringToTop('JardinHud');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('JardinHud'));
    const off = subscribe(() => this.refreshThirst());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    fadeIn(this);
  }

  /** Called by the HUD after a session so plants can grow with a sparkle. */
  afterSession(r: SessionResult): void {
    this.layout();
    const reduce = state().settings.reduceMotion;
    if (r.grew.length) this.time.delayedCall(250, () => sfx('grow'));
    for (const id of r.grew) {
      const p = this.plants.get(id);
      if (!p) continue;
      if (!reduce) {
        this.add.particles(p.x, p.y - 12, 'sparkle-s', { speed: { min: 15, max: 40 }, lifespan: 700, quantity: 6, alpha: { start: 1, end: 0 }, emitting: false }).explode(6);
        this.tweens.add({ targets: p, y: p.y - 2, duration: 120, yoyo: true, repeat: 1 });
      }
    }
    for (const id of r.shrank) {
      const p = this.plants.get(id);
      if (p && !reduce) this.tweens.add({ targets: p, x: p.x + 1, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private planted(): Card[] {
    const S = state();
    return catalog(S).filter((c) => S.cards[c.id]);
  }

  /** Lays out flower beds, one per word family. */
  layout(): void {
    const { W, H } = this;
    this.children.list.filter((o) => o.getData?.('bed')).forEach((o) => o.destroy());
    this.plants.clear();
    const S = state();
    const cards = this.planted();
    const cols = Math.max(3, Math.floor((W - 4) / CELL_W));
    const left = Math.round((W - cols * CELL_W) / 2);
    let y = gTop + 22;
    const today = dayKey();

    if (!cards.length) {
      const msg = pixelText(this, W / 2, y + 14, 'Tu jardín está vacío', 6, PAL.plum, PAL.white).setData('bed', 1);
      const msg2 = pixelText(this, W / 2, y + 24, 'Toca Sembrar 🌱', 6, PAL.deepLav, PAL.white).setData('bed', 1);
      const pal = this.add.sprite(W / 2, y + 44, 'pal-0').play('pal-bob').setData('bed', 1);
      void msg;
      void msg2;
      void pal;
      this.worldH = H;
      return;
    }

    for (const fam of ORDER) {
      const list = cards.filter((c) => c.family === fam).sort((a, b) => S.cards[b.id].box - S.cards[a.id].box);
      if (!list.length) continue;
      // wooden sign for the bed
      const sign = this.add.container(left + 2, y).setData('bed', 1);
      const label = `${FAMILY_NAME[fam]} · ${list.length}`;
      const g = this.add.graphics();
      const sw = Math.round(label.length * 3.1) + 6;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.plum).color).fillRect(0, -5, sw, 10);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.sand).color).fillRect(1, -4, sw - 2, 8);
      sign.add([g, pixelText(this, sw / 2, 0, label, 6, PAL.plum, PAL.cream)]);
      y += 6;
      list.forEach((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = left + col * CELL_W + CELL_W / 2;
        const py = y + row * CELL_H + CELL_H;
        this.addPlant(c, Math.round(x), Math.round(py), today);
      });
      y += Math.ceil(list.length / cols) * CELL_H + 12;
    }
    this.worldH = Math.max(H, y + gBottom + 6);
    this.clampScroll();
  }

  private addPlant(c: Card, x: number, y: number, today: string): void {
    const st = state().cards[c.id];
    const t = thirst(st, today);
    let key = plantKey(c.family, st.box, t);
    // real art: plant-<family>-<stage>.png is used for every thirst level, tinted when thirsty
    const art = `plant-${c.family}-${st.box}`;
    const useArt = !this.textures.exists(key) && this.textures.exists(art);
    if (useArt) key = art;
    else if (!this.textures.exists(key)) this.textures.addCanvas(key, plantCanvas(c.family, st.box, t));
    const cont = this.add.container(x, y).setData('bed', 1);
    if (st.box >= 8 && t === 0) {
      const glow = this.add.image(0, -14, 'moon-glow').setAlpha(0.5).setScale(0.75);
      cont.add(glow);
      if (!state().settings.reduceMotion) this.tweens.add({ targets: glow, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1 });
    }
    const img = this.add.image(0, -PLANT_H / 2, key);
    if (useArt && t) img.setTint(t === 2 ? 0xd8c0a0 : 0xeee4d8).setAngle(t === 2 ? 8 : 4);
    cont.add(img);
    if (t > 0) {
      // just above the top of this plant
      const tops = [4, 7, 9, 12, 14, 17, 20, 22, 22];
      const d = this.add.image(5, -tops[st.box] - 4, 'drop');
      cont.add(d);
      if (!state().settings.reduceMotion)
        this.time.addEvent({ delay: t === 2 ? 500 : 800, loop: true, callback: () => d.setVisible(!d.visible) });
    }
    const hit = this.add.zone(0, -PLANT_H / 2, PLANT_W + 4, PLANT_H).setInteractive();
    hit.on('pointerup', () => {
      if (this.dragMoved > 4) return;
      openInfo(c.id, (r) => this.afterSession(r));
    });
    cont.add(hit);
    cont.setData('id', c.id);
    this.plants.set(c.id, cont);
  }

  private refreshThirst(): void {
    // cheap check: relayout only if a plant's look changed
    const S = state();
    const today = dayKey();
    for (const [id, cont] of this.plants) {
      const st = S.cards[id];
      const img = cont.list.find((o) => o instanceof Phaser.GameObjects.Image && (o as Phaser.GameObjects.Image).texture.key.startsWith('plant-')) as
        | Phaser.GameObjects.Image
        | undefined;
      if (!st || !img) return this.layout();
      const card = catalog(S).find((c) => c.id === id)!;
      const want = plantKey(card.family, st.box, thirst(st, today));
      const art = `plant-${card.family}-${st.box}`;
      if (img.texture.key !== want && img.texture.key !== art) return this.layout();
    }
    if (this.plants.size !== Object.keys(S.cards).length) this.layout();
  }

  private setupScroll(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragY = p.y;
      this.dragMoved = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragY === null || !p.isDown) return;
      const z = this.cameras.main.zoom;
      const dy = (p.y - this.dragY) / z;
      this.dragY = p.y;
      this.dragMoved += Math.abs(dy);
      this.scrollY -= dy;
      this.clampScroll();
    });
    this.input.on('pointerup', () => (this.dragY = null));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.scrollY += dy / this.cameras.main.zoom;
      this.clampScroll();
    });
  }

  private clampScroll(): void {
    const H = this.H;
    this.scrollY = Math.max(0, Math.min(this.scrollY, Math.max(0, this.worldH - H)));
    this.cameras.main.setScroll(0, Math.round(this.scrollY));
  }
}
