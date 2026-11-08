import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state } from '../state/store';
import { spaceCanvas, enemyCanvas } from '../art/duel';
import { openDuel, closeDuel, duelBusy } from '../ui/duelPanel';
import type { Battle } from '../engine/duel';

/** El Duelo: the arena. The cards and questions live in a sheet (src/ui/duelPanel.ts). */
export class DueloScene extends Phaser.Scene {
  private W = 0;
  private H = 0;
  private enemy?: Phaser.GameObjects.Image;
  private bars?: Phaser.GameObjects.Container;
  private idle?: Phaser.GameObjects.Container;
  private lv = 0;

  constructor() {
    super('Duelo');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.W = W;
    this.H = H;
    const key = `space-${W}x${H}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, spaceCanvas(W, H));
    this.add.image(0, 0, key).setOrigin(0);
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    g.fillStyle(hex('#1b0523')).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow').setDepth(31);
    this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true }).setDepth(31).on('pointerup', () => !duelBusy() && goTo(this, 'Cielo'));
    pixelText(this, W / 2, 8, 'El Duelo', 8, PAL.star, PAL.plum).setDepth(31);
    pixelText(this, W / 2, 18, 'El Tarot de las Palabras', 8, PAL.lilac, PAL.plum).setDepth(31);
    fadeIn(this);
    openDuel(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeDuel());
  }

  private enemyTex(lv: number, hurt: boolean): string {
    const k = `enemy-${lv}-${hurt ? 1 : 0}`;
    if (!this.textures.exists(k)) this.textures.addCanvas(k, enemyCanvas(lv, hurt));
    return k;
  }

  /** The map: your companion rides a star while you choose a duel. */
  showMap(): void {
    this.enemy?.destroy();
    this.enemy = undefined;
    this.bars?.destroy();
    this.bars = undefined;
    this.idle?.destroy();
    const c = this.add.container(this.W / 2, Math.round(this.H * 0.26));
    c.add([this.add.image(0, 6, 'star-gold').setScale(2), this.add.sprite(0, -4, 'pal-0').play('pal-bob')]);
    this.idle = c;
    if (!state().settings.reduceMotion) this.tweens.add({ targets: c, y: c.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  showBattle(b: Battle): void {
    this.idle?.destroy();
    this.idle = undefined;
    this.lv = b.lv;
    this.enemy?.destroy();
    this.enemy = this.add.image(this.W / 2, Math.round(this.H * 0.2), this.enemyTex(b.lv, false)).setScale(2);
    if (!state().settings.reduceMotion) this.tweens.add({ targets: this.enemy, y: this.enemy.y - 3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.update2(b);
  }

  /** Redraws HP bars, shield and the enemy's next attack. */
  update2(b: Battle): void {
    this.bars?.destroy();
    const W = this.W;
    const c = this.add.container(0, 0).setDepth(20);
    const bar = (x: number, y: number, w: number, v: number, max: number, col: string) => {
      const g = this.add.graphics();
      g.fillStyle(hex(PAL.plum)).fillRect(x - 1, y - 1, w + 2, 6);
      g.fillStyle(hex('#2a1438')).fillRect(x, y, w, 4);
      g.fillStyle(hex(col)).fillRect(x, y, Math.round((w * Math.max(0, v)) / max), 4);
      return g;
    };
    const ey = Math.round(this.H * 0.2) + 38;
    c.add(pixelText(this, W / 2, ey, b.e.n, 8, PAL.white, PAL.plum));
    c.add(bar(W / 2 - 40, ey + 8, 80, b.e.hp, b.e.max, '#c86bd8'));
    c.add(pixelText(this, W / 2, ey + 19, `${b.e.hp}/${b.e.max} · ataca ${b.intent}`, 8, PAL.lilac, PAL.plum));
    const py = Math.round(this.H * 0.53) - 14;
    c.add(pixelText(this, 30, py - 1, 'Tú', 8, PAL.white, PAL.plum));
    c.add(bar(44, py - 3, 80, b.hp, b.max, PAL.pink));
    c.add(pixelText(this, 150, py - 1, `${b.hp}/${b.max}${b.shield ? ` 🛡${b.shield}` : ''}`, 8, PAL.cream, PAL.plum));
    this.bars = c;
  }

  /** Effects for card plays and enemy attacks. */
  fx(kind: Battle['fx'], amount = 0): void {
    const reduce = state().settings.reduceMotion;
    const W = this.W;
    const float = (txt: string, col: string, y: number) => {
      const t = pixelText(this, W / 2, y, txt, 16, col, PAL.plum).setDepth(40);
      this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: reduce ? 10 : 900, onComplete: () => t.destroy() });
    };
    const ey = Math.round(this.H * 0.2);
    if (kind === 'hit' && this.enemy) {
      this.enemy.setTexture(this.enemyTex(this.lv, true));
      this.time.delayedCall(160, () => this.enemy?.setTexture(this.enemyTex(this.lv, false)));
      if (!reduce) {
        this.tweens.add({ targets: this.enemy, x: W / 2 + 3, duration: 50, yoyo: true, repeat: 3 });
        this.add.particles(W / 2, ey, 'sparkle-b', { speed: { min: 30, max: 70 }, lifespan: 600, quantity: 10, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(35).explode(10);
      }
      float(`-${amount}`, PAL.star, ey - 10);
    } else if (kind === 'block') float(`🛡 +${amount}`, '#7cc8ff', Math.round(this.H * 0.45));
    else if (kind === 'heal') float(`♥ +${amount}`, PAL.pink, Math.round(this.H * 0.45));
    else if (kind === 'miss') float('…', PAL.lilac, ey + 20);
    else if (kind === 'ouch') {
      if (!reduce) this.cameras.main.shake(180, 0.01);
      this.cameras.main.flash(160, 232, 96, 122);
      float(`-${amount}`, '#e8607a', Math.round(this.H * 0.45));
    } else if (kind === 'blocked') float('¡Bloqueado!', '#7cc8ff', Math.round(this.H * 0.45));
  }

  defeat(): void {
    if (!this.enemy) return;
    this.tweens.killTweensOf(this.enemy);
    this.tweens.add({ targets: this.enemy, alpha: 0, scale: 2.4, duration: state().settings.reduceMotion ? 10 : 700 });
  }
}
