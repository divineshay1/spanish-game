import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { goTo, fadeIn } from '../game/transition';
import { state } from '../state/store';
import { patientCanvas, patientKey, roomCanvas, deskCanvas, HOTSPOTS, PAT_H, type Pose } from '../art/clinic';
import type { Patient } from '../engine/clinic';
import { openClinic, closeClinic, clinicBusy } from '../ui/clinicPanel';

/** How much of the screen the task sheet covers (matches .sheet .panel in CSS). */
export const SHEET = 0.47;

/**
 * La Clínica: the room and the patient. The questions and answers live in a
 * sheet over the bottom of the screen (src/ui/clinicPanel.ts), which drives this scene.
 */
export class ClinicaScene extends Phaser.Scene {
  private W = 0;
  private roomTop = 24;
  private floorY = 0;
  private bg?: Phaser.GameObjects.Image;
  private desk?: Phaser.GameObjects.Image;
  private pat?: Phaser.GameObjects.Image;
  private bubble?: Phaser.GameObjects.Container;
  private hud?: Phaser.GameObjects.Container;
  private hl?: Phaser.GameObjects.Graphics;
  private zones: Phaser.GameObjects.Zone[] = [];
  private breathTimer?: Phaser.Time.TimerEvent;
  private p: Patient | null = null;
  private view: 'front' | 'back' = 'front';
  private pose: Pose = {};
  private room: 'desk' | 'exam' = 'exam';

  constructor() {
    super('Clinica');
  }

  create(): void {
    const { W, H } = setupView(this);
    this.W = W;
    this.floorY = Math.round(H * (1 - SHEET)) - 4;
    this.p = null;
    this.zones = [];
    this.setRoom('exam');
    this.setHud(5, '');
    fadeIn(this);
    openClinic(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => closeClinic());
  }

  leave(): void {
    goTo(this, 'Cielo');
  }

  setRoom(room: 'desk' | 'exam'): void {
    this.room = room;
    const h = this.floorY + 6 - this.roomTop;
    const key = `room-${room}-${this.W}x${h}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, roomCanvas(this.W, h, room));
    this.bg?.destroy();
    this.bg = this.add.image(0, this.roomTop, key).setOrigin(0).setDepth(0);
    this.desk?.destroy();
    this.desk = undefined;
    if (room === 'desk') {
      const dk = `desk-${this.W}`;
      if (!this.textures.exists(dk)) this.textures.addCanvas(dk, deskCanvas(this.W));
      this.desk = this.add.image(0, this.floorY - 22, dk).setOrigin(0).setDepth(5);
    }
    this.placePatient();
  }

  setHud(hearts: number, label: string): void {
    this.hud?.destroy();
    const c = this.add.container(0, 0).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, this.W, this.roomTop);
    g.fillStyle(hex(PAL.blush)).fillRect(0, 0, this.W, this.roomTop - 1);
    c.add(g);
    c.add(this.add.image(13, 12, 'back-arrow'));
    const z = this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true });
    z.on('pointerup', () => !clinicBusy() && this.leave());
    c.add(z);
    c.add(pixelText(this, this.W / 2, 7, 'La Clínica', 8, PAL.white, PAL.plum));
    if (label) c.add(pixelText(this, this.W / 2, 17, label, 8, PAL.plum, PAL.white));
    // patience hearts, top right
    for (let i = 0; i < 5; i++) c.add(pixelText(this, this.W - 44 + i * 9, 12, '♥', 8, i < hearts ? '#e8607a' : PAL.rose, PAL.plum));
    this.hud = c;
  }

  setPatient(p: Patient | null): void {
    this.p = p;
    this.view = 'front';
    this.pose = {};
    this.placePatient();
  }

  setPose(pose: Pose, view: 'front' | 'back' = this.view): void {
    this.pose = pose;
    this.view = view;
    this.drawPatient();
  }

  getView(): 'front' | 'back' {
    return this.view;
  }

  private placePatient(): void {
    this.pat?.destroy();
    this.pat = undefined;
    if (!this.p) return;
    this.drawPatient();
  }

  private drawPatient(): void {
    if (!this.p) return;
    this.breathTimer?.remove();
    const tex = (pose: Pose) => {
      const k = patientKey(this.p!.look, this.p!.gender, this.view, pose);
      if (!this.textures.exists(k)) this.textures.addCanvas(k, patientCanvas(this.p!.look, this.p!.gender, this.view, pose));
      return k;
    };
    const k = tex(this.pose);
    const x = Math.round(this.W / 2 + 8);
    const y = this.floorY - PAT_H + (this.room === 'desk' ? 4 : 2);
    if (!this.pat) this.pat = this.add.image(x, y, k).setOrigin(0.5, 0).setDepth(3);
    else this.pat.setTexture(k);
    if (this.pose.breathe && !state().settings.reduceMotion) {
      const a = tex({ ...this.pose, inhale: false });
      const b = tex({ ...this.pose, inhale: true });
      let on = false;
      this.breathTimer = this.time.addEvent({ delay: 600, loop: true, callback: () => this.pat?.setTexture((on = !on) ? b : a) });
    }
  }

  /** The patient walks in from the right. */
  walkIn(): Promise<void> {
    return new Promise((res) => {
      if (!this.pat || state().settings.reduceMotion) return res();
      const x = this.pat.x;
      this.pat.x = this.W + 30;
      this.tweens.add({ targets: this.pat, x, duration: 700, ease: 'Sine.out', onUpdate: () => this.pat && (this.pat.x = Math.round(this.pat.x)), onComplete: () => res() });
    });
  }

  /** The patient walks out (to the left if they gave up, right if all set). */
  walkOut(left: boolean): Promise<void> {
    return new Promise((res) => {
      this.say(false);
      if (!this.pat || state().settings.reduceMotion) return res();
      this.tweens.add({ targets: this.pat, x: left ? -30 : this.W + 30, duration: 700, ease: 'Sine.in', onComplete: () => res() });
    });
  }

  /** "..." speech bubble while the patient talks. */
  say(on: boolean): void {
    this.bubble?.destroy();
    this.bubble = undefined;
    if (!on || !this.pat) return;
    const c = this.add.container(this.pat.x + 22, this.pat.y + 2).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(-12, -7, 24, 13);
    g.fillStyle(hex(PAL.white)).fillRect(-11, -6, 22, 11);
    g.fillStyle(hex(PAL.plum)).fillRect(-10, 6, 3, 2).fillRect(-12, 8, 2, 1);
    g.fillStyle(hex(PAL.deepLav)).fillRect(-6, -1, 2, 2).fillRect(-1, -1, 2, 2).fillRect(4, -1, 2, 2);
    c.add(g);
    this.bubble = c;
  }

  /** Lets you tap the body where it hurts. */
  setHotspots(active: boolean, selected: string | undefined, onTap: (part: string) => void): void {
    this.zones.forEach((z) => z.destroy());
    this.zones = [];
    this.hl?.destroy();
    this.hl = undefined;
    if (!this.pat) return;
    const ox = this.pat.x - this.pat.width / 2;
    const oy = this.pat.y;
    if (selected) {
      this.hl = this.add.graphics().setDepth(4);
      for (const r of HOTSPOTS[selected] || []) {
        if (r.view !== this.view) continue;
        this.hl.fillStyle(0xe8607a, 0.45).fillRect(ox + r.x, oy + r.y, r.w, r.h);
        this.hl.lineStyle(1, hex(PAL.plum), 1).strokeRect(ox + r.x + 0.5, oy + r.y + 0.5, r.w - 1, r.h - 1);
      }
    }
    if (!active) return;
    for (const [part, rects] of Object.entries(HOTSPOTS))
      for (const r of rects) {
        if (r.view !== this.view) continue;
        const z = this.add.zone(ox + r.x + r.w / 2, oy + r.y + r.h / 2, r.w, r.h).setInteractive({ useHandCursor: true }).setDepth(6);
        z.on('pointerup', () => onTap(part));
        this.zones.push(z);
      }
  }

  /** Little sparkle burst over the patient. */
  cheer(): void {
    if (!this.pat || state().settings.reduceMotion) return;
    this.add
      .particles(this.pat.x, this.pat.y + 10, 'sparkle-s', { speed: { min: 15, max: 45 }, lifespan: 700, quantity: 8, alpha: { start: 1, end: 0 }, emitting: false })
      .setDepth(12)
      .explode(8);
  }

  /** A little shake when an answer costs patience. */
  oops(): void {
    if (!this.pat || state().settings.reduceMotion) return;
    this.tweens.add({ targets: this.pat, x: this.pat.x + 2, duration: 50, yoyo: true, repeat: 3 });
  }
}
