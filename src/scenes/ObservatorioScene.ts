import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state } from '../state/store';
import { skyCanvas } from '../art/sky';
import { makeCanvas } from '../art/canvas';
import { rng } from '../art/rng';
import { openGrammar, grammarOpen, type Section } from '../ui/grammarPanel';
import { sfx } from '../audio/sfx';

/** Each grammar section is a star in the dome's constellation. Positions are fractions of the dome. */
const STARS: [Section, string, number, number][] = [
  ['conj', 'Conjugar', 0.22, 0.16],
  ['verbs', '100 Verbos', 0.62, 0.1],
  ['tenses', 'Tiempos', 0.82, 0.3],
  ['qw', 'Preguntas', 0.4, 0.34],
  ['conn', 'Conectores', 0.14, 0.46],
  ['topics', 'Temas', 0.66, 0.5],
  ['difs', 'Diferencias', 0.3, 0.64],
  ['cimientos', 'Cimientos', 0.84, 0.7],
  ['armar', 'Armar', 0.54, 0.8],
  ['fino', 'Oído fino', 0.16, 0.86],
  ['sonidos', 'Sonidos', 0.76, 0.94],
];
const LINKS: [number, number][] = [[0, 1], [1, 2], [0, 3], [3, 2], [0, 4], [3, 5], [4, 6], [5, 7], [6, 8], [5, 8], [6, 9], [8, 10], [7, 10]];

function telescope(): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(30, 30);
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  for (let i = 0; i < 18; i++) r(4 + i, 14 - Math.floor(i / 2), 4, 4, i < 2 ? PAL.plum : PAL.lavender);
  r(20, 4, 6, 6, PAL.plum);
  r(21, 5, 4, 4, PAL.star);
  r(12, 14, 2, 14, PAL.plum);
  r(6, 26, 14, 2, PAL.plum);
  r(8, 18, 2, 10, PAL.plum);
  r(16, 18, 2, 10, PAL.plum);
  return c;
}

/** El Observatorio: a starry grammar tower. */
export class ObservatorioScene extends Phaser.Scene {
  constructor() {
    super('Observatorio');
  }

  create(): void {
    const { W, H } = setupView(this);
    const key = `obs-sky-${W}x${H}`;
    if (!this.textures.exists(key))
      this.textures.addCanvas(key, skyCanvas(W, H, [[0, PAL.navy], [0.55, PAL.navy], [0.75, PAL.deepLav], [0.9, PAL.plum], [1, PAL.plum]]));
    this.add.image(0, 0, key).setOrigin(0);
    const reduce = state().settings.reduceMotion;
    const r = rng(12);
    for (let i = 0; i < 70; i++) {
      const s = this.add.image(Math.floor(r() * W), Math.floor(28 + r() * (H - 90)), r() < 0.2 ? 'dot-star' : 'dot-white');
      if (!reduce && i % 3 === 0) this.time.addEvent({ delay: 500 + r() * 1500, loop: true, callback: () => s.setAlpha(s.alpha === 1 ? 0.3 : 1) });
    }
    // floor with the telescope
    const floor = this.add.graphics();
    floor.fillStyle(hex(PAL.plum)).fillRect(0, H - 40, W, 40);
    floor.fillStyle(hex(PAL.deepLav)).fillRect(0, H - 40, W, 2);
    if (!this.textures.exists('telescope')) this.textures.addCanvas('telescope', telescope());
    this.add.image(W - 26, H - 52, 'telescope');
    this.add.sprite(26, H - 48, 'pal-0').play('pal-bob');

    // the constellation
    const top = 34;
    const dh = H - 40 - top - 28;
    const pos = STARS.map(([, , fx, fy]) => ({ x: Math.round(10 + fx * (W - 20)), y: Math.round(top + fy * dh) }));
    const lines = this.add.graphics();
    lines.lineStyle(1, hex(PAL.lavender), 0.6);
    for (const [a, b] of LINKS) lines.lineBetween(pos[a].x, pos[a].y, pos[b].x, pos[b].y);
    STARS.forEach(([sec, name], i) => {
      const { x, y } = pos[i];
      const glow = this.add.image(x, y, 'moon-glow').setAlpha(0.35).setScale(0.5);
      const star = this.add.image(x, y, 'sparkle-b');
      const lbl = pixelText(this, x, y + 10, name, 8, PAL.white, PAL.plum);
      void lbl;
      if (!reduce) this.tweens.add({ targets: glow, alpha: 0.15, duration: 1200 + i * 90, yoyo: true, repeat: -1 });
      const z = this.add.zone(x, y + 4, 44, 26).setInteractive({ useHandCursor: true });
      z.on('pointerup', () => {
        if (grammarOpen()) return;
        sfx('sparkle');
        star.setTexture('star-gold');
        this.time.delayedCall(300, () => star.setTexture('sparkle-b'));
        openGrammar(sec);
      });
    });

    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    g.fillStyle(hex(PAL.navy)).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow');
    this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true }).on('pointerup', () => !grammarOpen() && goTo(this, 'Cielo'));
    pixelText(this, W / 2, 8, 'El Observatorio', 8, PAL.star, PAL.plum);
    pixelText(this, W / 2, 18, 'Toca una estrella', 8, PAL.lilac, PAL.plum);
    fadeIn(this);
  }
}

export const OBS_STARS = STARS;
