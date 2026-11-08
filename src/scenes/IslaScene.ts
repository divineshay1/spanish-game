import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state } from '../state/store';
import { seaCanvas, waveCanvas, starFloat } from '../art/sea';
import { openIsla, closeIsla, islaPlaying } from '../ui/islaPanel';
import { rng } from '../art/rng';

/** La Isla de Inmersión: a starry night over the sea; the activities sit in a sheet below. */
export class IslaScene extends Phaser.Scene {
  constructor() {
    super('Isla');
  }

  create(): void {
    const { W, H } = setupView(this);
    const horizon = Math.round(H * 0.24);
    const key = `sea-${W}x${H}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, seaCanvas(W, H, horizon));
    this.add.image(0, 0, key).setOrigin(0);
    const reduce = state().settings.reduceMotion;

    // big yellow stars that twinkle
    const r = rng(8);
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(Math.floor(10 + r() * (W - 20)), Math.floor(30 + r() * horizon * 0.5), 'star-gold');
      if (!reduce) this.time.addEvent({ delay: 500 + r() * 900, loop: true, callback: () => s.setAlpha(s.alpha === 1 ? 0.4 : 1) });
    }
    if (!this.textures.exists('waves')) this.textures.addCanvas('waves', waveCanvas());
    const waves = [0, 1, 2].map((i) => this.add.tileSprite(0, horizon + 8 + i * 14, W, 8, 'waves').setOrigin(0).setAlpha(1 - i * 0.2));
    if (!this.textures.exists('star-float')) this.textures.addCanvas('star-float', starFloat());
    const fx = Math.round(W * 0.68);
    const fy = horizon + 16;
    const floatImg = this.add.image(fx, fy, 'star-float');
    const pal = this.add.sprite(fx, fy - 8, 'pal-0').play('pal-bob');
    if (!reduce) {
      this.events.on('update', (_t: number, dt: number) => waves.forEach((w, i) => (w.tilePositionX += dt * 0.004 * (i + 1) * (i % 2 ? -1 : 1))));
      let up = false;
      this.time.addEvent({
        delay: 700,
        loop: true,
        callback: () => {
          up = !up;
          floatImg.y = fy + (up ? -1 : 0);
          pal.y = fy - 8 + (up ? -1 : 0);
        },
      });
    }

    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    g.fillStyle(hex(PAL.navy)).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow');
    this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (!islaPlaying()) goTo(this, 'Cielo');
    });
    pixelText(this, W / 2, 8, 'La Isla de Inmersión', 8, PAL.star, PAL.plum);
    pixelText(this, W / 2, 18, 'Solo español', 8, PAL.lilac, PAL.plum);

    fadeIn(this);
    openIsla();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeIsla());
  }
}
