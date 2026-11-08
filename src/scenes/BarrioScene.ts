import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state, subscribe } from '../state/store';
import { streetSky, facade, streetStrip, BW } from '../art/barrio';
import { patientCanvas, patientKey, PAT_H } from '../art/clinic';
import { PLACES, placeDone, type Place } from '../engine/barrio';
import { openBarrio, closeBarrio, barrioTalking } from '../ui/barrioPanel';
import { rng } from '../art/rng';
import type { Look } from '../engine/clinic';

const LOOKS: Look[] = [
  { skin: '#e8b595', hair: '#5b3a29', shirt: '#c98b96', pants: '#6f7a86' },
  { skin: '#c68a64', hair: '#1f1a1a', shirt: '#a8b7a0', pants: '#8f8678' },
  { skin: '#f0c7a8', hair: '#8a6a45', shirt: '#8aa0b8', pants: '#a38d78' },
  { skin: '#a9714c', hair: '#3a2a22', shirt: '#d7b98f', pants: '#6f7a86' },
  { skin: '#d9a07c', hair: '#1f1a1a', shirt: '#b59ac0', pants: '#8f8678' },
  { skin: '#e8b595', hair: '#b5a79a', shirt: '#c98b96', pants: '#a38d78' },
  { skin: '#c68a64', hair: '#5b3a29', shirt: '#8aa0b8', pants: '#6f7a86' },
];
/** You, the medical assistant, in lavender scrubs. */
const ME: Look = { skin: '#d9a07c', hair: '#3a2a22', shirt: '#b399f5', pants: '#8f76d9' };

/** El Barrio: a walkable street. Tap someone to talk; tap the street to walk. */
export class BarrioScene extends Phaser.Scene {
  private me?: Phaser.GameObjects.Image;
  private worldW = 0;
  private groundY = 0;
  private marks: Phaser.GameObjects.Container[] = [];
  private viewW = 0;

  constructor() {
    super('Barrio');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.groundY = Math.round(H * 0.5);
    this.worldW = PLACES.length * BW + 40;
    const cam = this.cameras.main;
    this.viewW = W;
    const sky = `barrio-sky-${W}x${H}`;
    if (!this.textures.exists(sky)) this.textures.addCanvas(sky, streetSky(W, H));
    this.add.image(0, 0, sky).setOrigin(0).setScrollFactor(0);
    const bh = this.groundY - 30;
    const reduce = state().settings.reduceMotion;
    const r = rng(9);
    PLACES.forEach((p, i) => {
      const k = `facade-${p.id}-${bh}`;
      if (!this.textures.exists(k)) this.textures.addCanvas(k, facade(p.wall, bh, i + 3));
      const x = 20 + i * BW;
      this.add.image(x, this.groundY - bh, k).setOrigin(0);
      pixelText(this, x + BW / 2, this.groundY - bh + 36, p.name, 8, PAL.plum, PAL.white).setDepth(2);
      // the person standing outside
      const look = LOOKS[i % LOOKS.length];
      const g = i % 2 ? 'm' : 'f';
      const pk = patientKey(look, g, 'front', {});
      if (!this.textures.exists(pk)) this.textures.addCanvas(pk, patientCanvas(look, g, 'front', {}));
      const npc = this.add.image(x + 26, this.groundY + 4 - PAT_H, pk).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(3);
      npc.on('pointerup', () => this.talkTo(p, npc.x));
      if (!reduce) this.tweens.add({ targets: npc, y: npc.y - 1, duration: 600 + r() * 400, yoyo: true, repeat: -1 });
    });
    const st = `street-${this.worldW}`;
    if (!this.textures.exists(st)) this.textures.addCanvas(st, streetStrip(this.worldW));
    this.add.image(0, this.groundY, st).setOrigin(0);
    const fill = this.add.graphics();
    fill.fillStyle(hex('#8f86a8')).fillRect(0, this.groundY + 24, this.worldW, H);
    this.drawMarks();
    const off = subscribe(() => this.drawMarks());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);

    // you
    const mk = patientKey(ME, 'f', 'back', {});
    if (!this.textures.exists(mk)) this.textures.addCanvas(mk, patientCanvas(ME, 'f', 'back', {}));
    const fk = patientKey(ME, 'f', 'front', {});
    if (!this.textures.exists(fk)) this.textures.addCanvas(fk, patientCanvas(ME, 'f', 'front', {}));
    this.me = this.add.image(10 + 14, this.groundY + 14 - PAT_H, fk).setOrigin(0.5, 0).setDepth(4);
    // the view slides left and right with you
    this.events.on('update', () => {
      if (!this.me) return;
      cam.setScroll(Math.round(Phaser.Math.Clamp(this.me.x - this.viewW / 2, 0, Math.max(0, this.worldW - this.viewW))), 0);
    });

    // tap the street to walk there
    this.input.on('pointerup', (ptr: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length || barrioTalking()) return;
      if (ptr.y / cam.zoom < 26) return;
      this.walkTo(ptr.worldX);
    });

    // top bar (fixed)
    const bar = this.add.graphics().setScrollFactor(0).setDepth(30);
    bar.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    bar.fillStyle(hex(PAL.pink)).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow').setScrollFactor(0).setDepth(31);
    this.add.zone(14, 12, 30, 26).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(31).on('pointerup', () => !barrioTalking() && goTo(this, 'Cielo'));
    pixelText(this, W / 2, 8, 'El Barrio', 8, PAL.white, PAL.plum).setScrollFactor(0).setDepth(31);
    pixelText(this, W / 2, 18, 'Toca a una persona para hablar', 8, PAL.cream, PAL.plum).setScrollFactor(0).setDepth(31);
    fadeIn(this);
    openBarrio(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeBarrio());
  }

  /** "!" over people you haven't finished talking with, ✓ over finished places. */
  private drawMarks(): void {
    this.marks.forEach((m) => m.destroy());
    this.marks = [];
    const S = state();
    PLACES.forEach((p, i) => {
      const done = placeDone(S, p);
      const x = 20 + i * BW + 26;
      const c = this.add.container(x, this.groundY - PAT_H - 4).setDepth(6);
      const g = this.add.graphics();
      g.fillStyle(hex(PAL.plum)).fillRect(-5, -6, 10, 11);
      g.fillStyle(hex(done ? PAL.mint : PAL.star)).fillRect(-4, -5, 8, 9);
      c.add([g, pixelText(this, 0, 0, done ? '✓' : '!', 8, PAL.plum, done ? PAL.mint : PAL.star)]);
      this.marks.push(c);
    });
  }

  walkTo(x: number): Promise<void> {
    return new Promise((res) => {
      if (!this.me) return res();
      const tx = Phaser.Math.Clamp(Math.round(x), 12, this.worldW - 12);
      this.tweens.killTweensOf(this.me);
      const dur = state().settings.reduceMotion ? 10 : Math.abs(tx - this.me.x) * 9;
      this.me.setFlipX(tx < this.me.x);
      this.tweens.add({ targets: this.me, x: tx, duration: dur, onUpdate: () => this.me && (this.me.x = Math.round(this.me.x)), onComplete: () => res() });
    });
  }

  private async talkTo(p: Place, npcX: number): Promise<void> {
    if (barrioTalking()) return;
    await this.walkTo(npcX - 18);
    openBarrio(this, p);
  }
}
