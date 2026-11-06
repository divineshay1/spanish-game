import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { skyCanvas } from '../art/sky';
import { cloudLayer } from '../art/clouds';
import { rng } from '../art/rng';
import { island, door } from '../art/sprites';
import { pixelText } from '../game/text';
import { pixelButton } from '../game/button';
import { setupView } from '../game/view';
import { goTo, fadeIn } from '../game/transition';
import { state, subscribe } from '../state/store';
import { openSettings, settingsOpen } from '../ui/settings';
import { openHoy, openProgreso, panelOpen } from '../ui/panels';
import { sessionOpen } from '../ui/session';
import { REALMS, TASKS, tasksDone, type Realm } from '../engine/daily';
import { curStreak, today } from '../state/progress';
import { speak } from '../audio/speech';
import { sfx } from '../audio/sfx';
import { now } from '../engine/clock';

const greeting = (): string => {
  const h = now().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

const CHEERS: [string, string][] = [
  ['¡Tú puedes!', 'You can do it!'],
  ['¿Regamos el jardín?', 'Shall we water the garden?'],
  ['Poco a poco se va lejos.', 'Little by little, you go far.'],
  ['¡Muy bien!', 'Very good!'],
  ['¡Vamos a practicar!', "Let's practice!"],
  ['¡Qué gusto verte!', 'So nice to see you!'],
];

const uiBusy = () => settingsOpen() || panelOpen() || sessionOpen();

/** El Cielo: the floating sky-island hub with a door to every realm. */
export class CieloScene extends Phaser.Scene {
  private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number; x: number }[] = [];
  private toast?: Phaser.GameObjects.Container;
  private bubble?: Phaser.GameObjects.Container;

  constructor() {
    super('Cielo');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.layers = [];
    this.input.enabled = true;
    const reduce = state().settings.reduceMotion;

    // sky: lavender at the top, melting into pink and blush, cream at the horizon
    const skyKey = `sky-${W}x${H}`;
    if (!this.textures.exists(skyKey))
      this.textures.addCanvas(skyKey, skyCanvas(W, H, [[0, PAL.lavender], [0.3, PAL.pink], [0.6, PAL.blush], [0.88, PAL.cream], [1, PAL.white]]));
    // real art: bg-cielo.png (216x440) replaces the drawn sky
    if (this.textures.exists('bg-cielo')) this.add.image(W / 2, H / 2, 'bg-cielo');
    else this.add.image(0, 0, skyKey).setOrigin(0);

    this.addStars(W, H, reduce);
    this.addMoon(W, reduce);
    this.addClouds('cloud-far', W, 48, Math.round(H * 0.3), 11, 5, 7, 2, { light: PAL.rose, mid: PAL.lilac, shade: PAL.lavender, deep: PAL.deepLav }, 0.6);
    this.addClouds('cloud-mid', W, 64, Math.round(H * 0.52), 23, 4, 11, 4, { light: PAL.white, mid: PAL.rose, shade: PAL.lilac, deep: PAL.lavender }, 0.85);

    // three islands: the big one in the middle, two islets below
    const doorsOf = (keys: string[]) => keys.map((k) => REALMS.find((r) => r.key === k)!);
    this.addIsland('island', 120, 64, W / 2, Math.round(H * 0.44), doorsOf(['observatorio', 'jardin', 'clinica']), 36, true, 0);
    this.addClouds('cloud-near', W, 70, Math.round(H * 0.6), 41, 3, 16, 8, { light: PAL.white, mid: PAL.cream, shade: PAL.rose, deep: PAL.lilac }, 1);
    this.addIsland('islet-a', 64, 36, Math.round(W * 0.27), Math.round(H * 0.66), doorsOf(['biblioteca', 'isla']), 30, false, 300);
    this.addIsland('islet-b', 84, 38, Math.round(W * 0.72), Math.round(H * 0.74), doorsOf(['duelo', 'cafe', 'barrio']), 24, false, 600);
    this.addClouds('cloud-floor', W, 60, H - 22, 57, 4, 14, 12, { light: PAL.white, mid: PAL.white, shade: PAL.cream, deep: PAL.rose }, 1);

    this.addHeader(W);
    this.addBottomBar(W, H);

    // tap the sky for sparkles
    const burst = this.add.particles(0, 0, 'sparkle-s', {
      speed: { min: 20, max: 60 }, lifespan: 600, quantity: 8, alpha: { start: 1, end: 0 }, gravityY: 40, emitting: false,
    });
    burst.setDepth(50);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length === 0 && !reduce && !uiBusy()) {
        burst.explode(8, Math.round(p.worldX), Math.round(p.worldY));
        sfx('sparkle');
      }
    });

    const off = subscribe(() => {
      this.header?.destroy();
      this.addHeader(W);
      this.bottom?.destroy();
      this.addBottomBar(W, H);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    fadeIn(this);
  }

  private header?: Phaser.GameObjects.Container;
  private bottom?: Phaser.GameObjects.Container;

  private addHeader(W: number): void {
    const S = state();
    const c = this.add.container(0, 0).setDepth(40);
    c.add(pixelText(this, W / 2, 14, 'MI ESPAÑOL', 8, PAL.star, PAL.plum));
    c.add(pixelText(this, W / 2, 29, 'El Cielo', 16, PAL.white, PAL.plum));
    c.add(pixelText(this, W / 2, 45, `${greeting()}, ${S.name}`, 8, PAL.white, PAL.plum));
    // today's XP bar
    const t = today(S);
    const bw = 84;
    const bx = Math.round(W / 2 - bw / 2);
    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(bx - 1, 55, bw + 2, 7);
    g.fillStyle(hex(PAL.cream)).fillRect(bx, 56, bw, 5);
    g.fillStyle(hex(PAL.star)).fillRect(bx, 56, Math.round((bw * Math.min(t.xp, S.goal)) / S.goal), 5);
    c.add(g);
    c.add(pixelText(this, W / 2, 69, `${t.xp} / ${S.goal} XP hoy`, 8, PAL.cream, PAL.deepLav));
    // streak, top left
    c.add(pixelText(this, 22, 13, `✦ ${curStreak(S)}`, 8, PAL.star, PAL.plum));
    c.add(pixelText(this, 22, 24, 'racha', 8, PAL.cream, PAL.deepLav));
    // settings gear, top right
    const gear = this.add.image(W - 12, 12, 'gear');
    const hit = this.add.zone(W - 14, 14, 28, 28).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      if (uiBusy()) return;
      sfx('tap');
      openSettings();
    });
    c.add([gear, hit]);
    this.header = c;
  }

  private addBottomBar(W: number, H: number): void {
    const S = state();
    const c = this.add.container(0, 0).setDepth(45);
    const gap = 6;
    const bw = Math.floor((W - gap * 3) / 2);
    const left = TASKS.length - tasksDone(S);
    const go = (what: string | null) => {
      if (!what) return;
      if (what === 'plant' || what === 'water' || what === 'focus') goTo(this, 'Jardin', { open: what });
    };
    c.add(
      pixelButton(this, gap, H - 32, bw, 24, 'Hoy', () => !uiBusy() && openHoy(go), {
        badge: left ? String(left) : undefined,
        face: PAL.white,
      }),
    );
    c.add(pixelButton(this, gap * 2 + bw, H - 32, bw, 24, 'Progreso', () => !uiBusy() && openProgreso()));
    this.bottom = c;
  }

  update(_t: number, dtMs: number): void {
    if (state().settings.reduceMotion) return;
    const dt = Math.min(dtMs, 100) / 1000;
    for (const l of this.layers) {
      l.x += l.speed * dt;
      l.sprite.tilePositionX = Math.round(l.x); // whole pixels only, so clouds never shimmer
    }
  }

  private addStars(W: number, H: number, reduce: boolean): void {
    const r = rng(3);
    for (let i = 0; i < 40; i++) {
      const key = r() < 0.2 ? 'dot-star' : r() < 0.5 ? 'dot-lilac' : 'dot-white';
      const s = this.add.image(Math.floor(r() * W), Math.floor(r() * H * 0.55), key);
      if (!reduce) this.time.addEvent({ delay: 400 + r() * 1600, loop: true, callback: () => s.setAlpha(s.alpha === 1 ? 0.35 : 1) });
    }
    for (let i = 0; i < 7; i++) {
      const s = this.add.image(Math.floor(8 + r() * (W - 16)), Math.floor(10 + r() * H * 0.5), 'sparkle-s');
      if (reduce) continue;
      const keys = ['sparkle-s', 'sparkle-b', 'sparkle-s', ''];
      let k = Math.floor(r() * 4);
      this.time.addEvent({
        delay: 350 + r() * 300,
        loop: true,
        callback: () => {
          k = (k + 1) % keys.length;
          if (keys[k]) s.setTexture(keys[k]).setVisible(true);
          else s.setVisible(false);
        },
      });
    }
  }

  private addMoon(W: number, reduce: boolean): void {
    const x = W - 30;
    const y = 88;
    const g = this.add.image(x, y, 'moon-glow').setAlpha(0.45);
    this.add.image(x, y, 'moon');
    if (!reduce) this.tweens.add({ targets: g, alpha: 0.25, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private addClouds(key: string, W: number, h: number, y: number, seed: number, count: number, size: number, speed: number,
    tones: { light: string; mid: string; shade: string; deep: string }, alpha: number): void {
    if (!this.textures.exists(key)) this.textures.addCanvas(key, cloudLayer(256, h, seed, count, size, tones));
    const sprite = this.add.tileSprite(0, y - h / 2, W, h, key).setOrigin(0).setAlpha(alpha);
    this.layers.push({ sprite, speed, x: seed * 13 });
  }

  private addIsland(key: string, w: number, h: number, x: number, cy: number, realms: Realm[], spacing: number, withPal: boolean, phase: number): void {
    if (!this.textures.exists(key)) this.textures.addCanvas(key, island(w, h));
    const isle = this.add.container(Math.round(x), cy);
    const land = this.add.image(0, 0, key);
    isle.add(land);
    const ground = -h / 2 + 14; // grass line inside the island sprite
    const reduce = state().settings.reduceMotion;
    realms.forEach((r, i) => {
      const dx = Math.round((i - (realms.length - 1) / 2) * spacing);
      const dkey = `door-${r.key}`;
      if (!this.textures.exists(dkey)) this.textures.addCanvas(dkey, door(r.door));
      const open = !!r.scene;
      const d = this.add.image(dx, ground - 8, dkey).setInteractive({ useHandCursor: true });
      if (!open) d.setAlpha(0.8);
      d.on('pointerup', () => {
        if (uiBusy()) return;
        if (open) {
          const wx = isle.x + dx;
          goTo(this, r.scene!, undefined, { x: wx, y: isle.y + ground - 8 });
        } else {
          sfx('locked');
          this.showToast(`${r.name}: ¡pronto! ✦`, isle.y - h / 2 - 12);
        }
      });
      // labels alternate between two heights so neighbours never overlap
      const label = pixelText(this, dx, ground - 22 - (i % 2) * 10, r.name, 8, open ? PAL.white : PAL.cream, PAL.plum);
      if (!open) label.setAlpha(0.85);
      isle.add([d, label]);
      if (open && !reduce) {
        const sp = this.add.image(dx + 6, ground - 15, 'sparkle-s');
        isle.add(sp);
        this.time.addEvent({ delay: 500, loop: true, callback: () => sp.setVisible(!sp.visible) });
      }
    });
    if (withPal) this.addCompanion(isle, ground, spacing);
    if (reduce) return;
    // gentle one-pixel bob
    let up = false;
    this.time.delayedCall(phase, () =>
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          up = !up;
          isle.y = cy + (up ? -1 : 0);
        },
      }),
    );
  }

  private addCompanion(isle: Phaser.GameObjects.Container, ground: number, spacing: number): void {
    const pal = this.add.sprite(-spacing / 2, ground - 6, 'pal-0').play('pal-bob').setInteractive({ useHandCursor: true });
    isle.add(pal);
    pal.on('pointerup', () => {
      if (uiBusy()) return;
      const [es, en] = CHEERS[Math.floor(Math.random() * CHEERS.length)];
      speak(es, state());
      sfx('sparkle');
      this.bubble?.destroy();
      const bx = isle.x + pal.x;
      const by = isle.y + pal.y - 22;
      const b = this.add.container(0, 0).setDepth(70);
      const t1 = pixelText(this, 0, -4, es, 8, PAL.plum, PAL.white);
      const t2 = pixelText(this, 0, 6, en, 8, PAL.deepLav, PAL.white);
      const w = Math.min(this.registry.get('W') - 8, Math.max(es.length, en.length) * 4.4 + 10);
      const g = this.add.graphics();
      g.fillStyle(hex(PAL.plum)).fillRect(-w / 2 - 1, -12, w + 2, 26);
      g.fillStyle(hex(PAL.white)).fillRect(-w / 2, -11, w, 24);
      g.fillStyle(hex(PAL.plum)).fillRect(-2, 14, 4, 2);
      b.add([g, t1, t2]);
      const W: number = this.registry.get('W');
      b.setPosition(Math.round(Phaser.Math.Clamp(bx, w / 2 + 4, W - w / 2 - 4)), Math.round(by));
      this.bubble = b;
      this.time.delayedCall(2600, () => b.destroy());
    });
    if (state().settings.reduceMotion) return;
    this.tweens.add({
      targets: pal,
      x: spacing / 2,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
      onUpdate: () => (pal.x = Math.round(pal.x)),
      onYoyo: () => pal.setFlipX(true),
      onRepeat: () => pal.setFlipX(false),
    });
  }

  private showToast(msg: string, y: number): void {
    this.toast?.destroy();
    const W: number = this.registry.get('W');
    const t = pixelText(this, W / 2, y, msg, 8, PAL.white, PAL.plum).setDepth(60);
    this.toast = t;
    this.tweens.add({ targets: t, y: t.y - 6, alpha: 0, delay: 900, duration: 700, onComplete: () => t.destroy() });
  }
}
