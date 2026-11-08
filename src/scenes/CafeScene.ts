import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state } from '../state/store';
import { cafeRoom, iconCanvas, ICON_IDS } from '../art/cafe';
import { patientCanvas, patientKey, PAT_H } from '../art/clinic';
import type { Look } from '../engine/clinic';
import { openCafe, closeCafe } from '../ui/cafePanel';
import { SHEET } from './ClinicaScene';

/** El Café: the counter and the customer; orders are taken in a sheet (src/ui/cafePanel.ts). */
export class CafeScene extends Phaser.Scene {
  private W = 0;
  private counterY = 0;
  private cust?: Phaser.GameObjects.Image;
  private tray?: Phaser.GameObjects.Container;
  private bubble?: Phaser.GameObjects.Container;

  constructor() {
    super('Cafe');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.W = W;
    this.counterY = Math.round(H * (1 - SHEET)) - 30;
    const key = `cafe-${W}x${H}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, cafeRoom(W, H, this.counterY));
    this.add.image(0, 0, key).setOrigin(0);
    for (const id of ICON_IDS) if (!this.textures.exists('icon-' + id)) this.textures.addCanvas('icon-' + id, iconCanvas(id));
    pixelText(this, W / 2, 40, 'MENÚ', 8, PAL.star, '#3d2b3a');
    pixelText(this, W / 2, 52, 'café · té · pan · sopa', 8, PAL.cream, '#3d2b3a');
    // the counter front, drawn over the customer so they stand behind it
    const front = this.add.graphics().setDepth(5);
    front.fillStyle(hex(PAL.sand)).fillRect(0, this.counterY - 4, W, 4);
    front.fillStyle(hex(PAL.white)).fillRect(0, this.counterY - 4, W, 1);
    front.fillStyle(hex(PAL.plum)).fillRect(0, this.counterY, W, 1);
    front.fillStyle(hex(PAL.clay)).fillRect(0, this.counterY + 1, W, H - this.counterY);
    front.fillStyle(hex(PAL.bark));
    for (let x = 8; x < W; x += 20) front.fillRect(x, this.counterY + 4, 1, H - this.counterY - 4);
    this.add.sprite(W - 20, this.counterY - 10, 'pal-0').play('pal-bob').setDepth(6);

    const g = this.add.graphics().setDepth(30);
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    g.fillStyle(hex(PAL.clay)).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow').setDepth(31);
    this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true }).setDepth(31).on('pointerup', () => goTo(this, 'Cielo'));
    pixelText(this, W / 2, 8, 'El Café', 8, PAL.white, PAL.plum).setDepth(31);
    pixelText(this, W / 2, 18, 'Escucha y sirve', 8, PAL.cream, PAL.plum).setDepth(31);
    fadeIn(this);
    openCafe(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeCafe());
  }

  /** A customer walks up to the counter (or leaves when look is null). */
  setCustomer(look: Look | null, gender: 'f' | 'm' = 'f'): Promise<void> {
    return new Promise((res) => {
      const reduce = state().settings.reduceMotion;
      if (!look) {
        this.say(false);
        if (!this.cust) return res();
        const c = this.cust;
        this.cust = undefined;
        this.tweens.add({ targets: c, x: -30, duration: reduce ? 10 : 600, onComplete: () => (c.destroy(), res()) });
        return;
      }
      const k = patientKey(look, gender, 'front', {});
      if (!this.textures.exists(k)) this.textures.addCanvas(k, patientCanvas(look, gender, 'front', {}));
      this.cust?.destroy();
      const x = Math.round(this.W / 2 - 10);
      this.cust = this.add.image(reduce ? x : this.W + 30, this.counterY - PAT_H + 34, k).setOrigin(0.5, 0).setDepth(2);
      if (reduce) return res();
      this.tweens.add({ targets: this.cust, x, duration: 700, ease: 'Sine.out', onUpdate: () => this.cust && (this.cust.x = Math.round(this.cust.x)), onComplete: () => res() });
    });
  }

  say(on: boolean): void {
    this.bubble?.destroy();
    this.bubble = undefined;
    if (!on || !this.cust) return;
    const c = this.add.container(this.cust.x + 24, this.cust.y + 4).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(-12, -7, 24, 13);
    g.fillStyle(hex(PAL.white)).fillRect(-11, -6, 22, 11);
    g.fillStyle(hex(PAL.plum)).fillRect(-10, 6, 3, 2);
    g.fillStyle(hex(PAL.deepLav)).fillRect(-6, -1, 2, 2).fillRect(-1, -1, 2, 2).fillRect(4, -1, 2, 2);
    c.add(g);
    this.bubble = c;
  }

  /** Shows what you've put on the tray on the counter. */
  setTray(qty: Record<string, number>, sugar: string | null, napkin: boolean): void {
    this.tray?.destroy();
    const c = this.add.container(0, this.counterY - 9).setDepth(8);
    const icons: string[] = [];
    for (const [id, q] of Object.entries(qty)) for (let i = 0; i < q; i++) icons.push(id);
    if (sugar === 'con') icons.push('azucar');
    if (napkin) icons.push('servilleta');
    const start = Math.round(this.W / 2 - (icons.length * 13) / 2) + 6;
    icons.slice(0, 12).forEach((id, i) => c.add(this.add.image(start + i * 13, 0, 'icon-' + id)));
    this.tray = c;
  }

  cheer(): void {
    if (!this.cust || state().settings.reduceMotion) return;
    this.add.particles(this.cust.x, this.cust.y + 10, 'sparkle-s', { speed: { min: 15, max: 45 }, lifespan: 700, quantity: 8, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(12).explode(8);
  }
}
