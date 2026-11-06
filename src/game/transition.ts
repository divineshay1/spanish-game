import Phaser from 'phaser';
import { state } from '../state/store';
import { PAL, hex } from './palette';
import { sfx } from '../audio/sfx';

/** Points of a 4-point star centred on 0,0. */
function starPoints(r: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.28;
    pts.push(new Phaser.Math.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
  }
  return pts;
}

/**
 * Star-burst screen change: a cream star grows from the tap point until it
 * covers the screen, then the next scene fades in. Instant with reduce motion.
 */
export function goTo(scene: Phaser.Scene, key: string, data?: object, from?: { x: number; y: number }): void {
  sfx('door');
  if (state().settings.reduceMotion) {
    scene.scene.start(key, data);
    return;
  }
  scene.input.enabled = false;
  const cam = scene.cameras.main;
  const W = cam.width / cam.zoom;
  const H = cam.height / cam.zoom;
  const ox = from?.x ?? W / 2;
  const oy = from?.y ?? H / 2;
  const g = scene.add.graphics().setDepth(1000).setScrollFactor(0);
  const prog = { r: 2 };
  const maxR = Math.hypot(W, H) * 2.2;
  scene.tweens.add({
    targets: prog,
    r: maxR,
    duration: 420,
    ease: 'Quad.easeIn',
    onUpdate: () => {
      g.clear();
      g.fillStyle(hex(PAL.white), 1);
      g.fillPoints(starPoints(prog.r).map((p) => new Phaser.Math.Vector2(Math.round(ox + p.x), Math.round(oy + p.y))), true);
      g.fillStyle(hex(PAL.blush), 1);
      g.fillPoints(starPoints(prog.r * 0.6).map((p) => new Phaser.Math.Vector2(Math.round(ox + p.x), Math.round(oy + p.y))), true);
      g.fillStyle(hex(PAL.cream), 1);
      g.fillPoints(starPoints(prog.r * 0.35).map((p) => new Phaser.Math.Vector2(Math.round(ox + p.x), Math.round(oy + p.y))), true);
    },
    onComplete: () => {
      cam.setBackgroundColor(PAL.cream);
      scene.scene.start(key, data);
    },
  });
}

export function fadeIn(scene: Phaser.Scene): void {
  if (!state().settings.reduceMotion) scene.cameras.main.fadeIn(320, 246, 228, 248);
}
