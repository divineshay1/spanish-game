import Phaser from 'phaser';
import { PAL } from '../game/palette';
import { skyCanvas } from '../art/sky';
import { cloudLayer } from '../art/clouds';
import { rng } from '../art/rng';
import { pixelText } from '../game/text';
import { setupView } from '../game/view';

const greeting = (): string => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

/** El Cielo: the floating sky-island hub. */
export class CieloScene extends Phaser.Scene {
  private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number; x: number }[] = [];
  private toast?: Phaser.GameObjects.Container;

  constructor() {
    super('Cielo');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.layers = [];

    // sky: lavender at the top, melting into pink and blush, cream at the horizon
    const skyKey = `sky-${W}x${H}`;
    if (!this.textures.exists(skyKey))
      this.textures.addCanvas(
        skyKey,
        skyCanvas(W, H, [
          [0, PAL.lavender],
          [0.32, PAL.pink],
          [0.62, PAL.blush],
          [0.9, PAL.cream],
          [1, PAL.white],
        ]),
      );
    this.add.image(0, 0, skyKey).setOrigin(0);

    this.addStars(W, H);
    this.addMoon(W);

    // three cloud layers, slower = farther away
    this.addClouds('cloud-far', W, 48, Math.round(H * 0.3), 11, 5, 7, 2, {
      light: PAL.rose, mid: PAL.lilac, shade: PAL.lavender, deep: PAL.deepLav,
    }, 0.6);
    this.addClouds('cloud-mid', W, 64, Math.round(H * 0.5), 23, 4, 11, 4, {
      light: PAL.white, mid: PAL.rose, shade: PAL.lilac, deep: PAL.lavender,
    }, 0.85);

    this.addIsland(W, H);

    // near clouds drift in front of the island's rocky underside
    this.addClouds('cloud-near', W, 70, Math.round(H * 0.6) + 44, 41, 3, 16, 8, {
      light: PAL.white, mid: PAL.cream, shade: PAL.rose, deep: PAL.lilac,
    }, 1);
    this.addClouds('cloud-floor', W, 60, H - 14, 57, 4, 14, 12, {
      light: PAL.white, mid: PAL.white, shade: PAL.cream, deep: PAL.rose,
    }, 1);

    // title
    pixelText(this, W / 2, 22, 'MI ESPAÑOL', 8, PAL.star, PAL.plum);
    pixelText(this, W / 2, 38, 'El Cielo', 16, PAL.white, PAL.plum);
    pixelText(this, W / 2, 56, `${greeting()}, Sha`, 8, PAL.white, PAL.plum);

    pixelText(this, W / 2, H - 12, 'toca el cielo ✦', 8, PAL.deepLav, PAL.white);

    // tap anywhere for a little burst of sparkles
    const burst = this.add.particles(0, 0, 'sparkle-s', {
      speed: { min: 20, max: 60 },
      lifespan: 600,
      quantity: 8,
      scale: 1,
      alpha: { start: 1, end: 0 },
      gravityY: 40,
      emitting: false,
    });
    burst.setDepth(50);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length === 0) burst.explode(8, Math.round(p.worldX), Math.round(p.worldY));
    });
  }

  update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 100) / 1000;
    for (const l of this.layers) {
      l.x += l.speed * dt;
      // whole pixels only, so clouds never shimmer
      l.sprite.tilePositionX = Math.round(l.x);
    }
  }

  private addStars(W: number, H: number): void {
    const r = rng(3);
    // tiny dot stars that blink
    for (let i = 0; i < 40; i++) {
      const key = r() < 0.2 ? 'dot-star' : r() < 0.5 ? 'dot-lilac' : 'dot-white';
      const s = this.add.image(Math.floor(r() * W), Math.floor(r() * H * 0.55), key);
      this.time.addEvent({
        delay: 400 + r() * 1600,
        loop: true,
        callback: () => s.setAlpha(s.alpha === 1 ? 0.35 : 1),
      });
    }
    // four-point sparkles that pulse small, big, small, off
    for (let i = 0; i < 7; i++) {
      const s = this.add.image(Math.floor(8 + r() * (W - 16)), Math.floor(10 + r() * H * 0.5), 'sparkle-s');
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

  private addMoon(W: number): void {
    const x = W - 34;
    const y = 82;
    const g = this.add.image(x, y, 'moon-glow').setAlpha(0.45);
    this.add.image(x, y, 'moon');
    this.tweens.add({ targets: g, alpha: 0.25, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private addClouds(
    key: string,
    W: number,
    h: number,
    y: number,
    seed: number,
    count: number,
    size: number,
    speed: number,
    tones: { light: string; mid: string; shade: string; deep: string },
    alpha: number,
  ): void {
    const tw = 256;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, cloudLayer(tw, h, seed, count, size, tones));
    const sprite = this.add.tileSprite(0, y - h / 2, W, h, key).setOrigin(0).setAlpha(alpha);
    this.layers.push({ sprite, speed, x: seed * 13 });
  }

  private addIsland(W: number, H: number): void {
    const cy = Math.round(H * 0.6);
    const isle = this.add.container(Math.round(W / 2), cy);
    const land = this.add.image(0, 0, 'island');
    const ground = -land.height / 2 + 14; // grass line inside the island sprite
    const doorDefs: [string, number, string][] = [
      ['door-tower', -36, 'Observatorio'],
      ['door-garden', 0, 'El Jardín'],
      ['door-clinic', 36, 'La Clínica'],
    ];
    isle.add(land);
    for (const [key, dx, label] of doorDefs) {
      const d = this.add.image(dx, ground - 8, key).setInteractive({ useHandCursor: true });
      d.on('pointerdown', () => this.showToast(`${label}: ¡pronto! ✦`));
      isle.add(d);
    }
    const pal = this.add.sprite(-18, ground - 6, 'pal-0').play('pal-bob');
    isle.add(pal);
    // the island gently bobs one pixel up and down
    let up = false;
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        up = !up;
        isle.y = cy + (up ? -1 : 0);
      },
    });
    // the companion wanders between the doors
    this.tweens.add({
      targets: pal,
      x: 18,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
      onUpdate: () => {
        pal.x = Math.round(pal.x);
      },
      onYoyo: () => pal.setFlipX(true),
      onRepeat: () => pal.setFlipX(false),
    });
  }

  private showToast(msg: string): void {
    this.toast?.destroy();
    const W: number = this.registry.get('W');
    const H: number = this.registry.get('H');
    const t = pixelText(this, W / 2, Math.round(H * 0.6) - 40, msg, 8, PAL.white, PAL.plum).setDepth(60);
    this.toast = t;
    this.tweens.add({ targets: t, y: t.y - 6, alpha: 0, delay: 900, duration: 700, onComplete: () => t.destroy() });
  }
}
