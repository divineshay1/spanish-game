import Phaser from 'phaser';
import { PAL, hex } from './palette';
import { pixelText } from './text';
import { sfx } from '../audio/sfx';

/**
 * A chunky pixel button: plum border, cream face, blush shadow.
 * Big touch area; presses down a pixel when tapped.
 */
export function pixelButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onTap: () => void,
  opts: { icon?: string; face?: string; badge?: string } = {},
): Phaser.GameObjects.Container {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const g = scene.add.graphics();
  const draw = (down: boolean) => {
    g.clear();
    const oy = down ? 1 : 0;
    g.fillStyle(hex(PAL.deepLav)).fillRect(1, 2, w - 2, h - 1);
    g.fillStyle(hex(PAL.plum)).fillRect(0, oy, w, h - 1);
    g.fillStyle(hex(opts.face ?? PAL.cream)).fillRect(1, 1 + oy, w - 2, h - 3);
    g.fillStyle(hex(PAL.white)).fillRect(1, 1 + oy, w - 2, 1);
  };
  draw(false);
  c.add(g);
  const parts: Phaser.GameObjects.GameObject[] = [];
  let tx = w / 2;
  if (opts.icon) {
    const img = scene.add.image(0, 0, opts.icon);
    const iw = img.width;
    const lblW = label ? label.length * 4.2 : 0;
    const start = Math.round((w - (iw + 3 + lblW)) / 2);
    img.setPosition(start + iw / 2, Math.round(h / 2) - 1);
    tx = start + iw + 3 + lblW / 2;
    parts.push(img);
  }
  if (label) parts.push(pixelText(scene, tx, Math.round(h / 2) - 1, label, 8, PAL.plum, PAL.white));
  if (opts.badge) {
    const bx = w - 4;
    const bg = scene.add.graphics();
    bg.fillStyle(hex(PAL.plum)).fillRect(bx - 6, -4, 12, 9);
    bg.fillStyle(hex(PAL.pink)).fillRect(bx - 5, -3, 10, 7);
    parts.push(bg, pixelText(scene, bx, 0, opts.badge, 8, PAL.white, PAL.plum));
  }
  c.add(parts);
  const zone = scene.add.zone(w / 2, h / 2, w + 4, h + 6).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerdown', () => {
    draw(true);
    parts.forEach((p) => (p as unknown as { y: number }).y++);
  });
  const up = (fire: boolean) => {
    draw(false);
    parts.forEach((p) => (p as unknown as { y: number }).y--);
    if (fire) {
      sfx('tap');
      onTap();
    }
  };
  let pressed = false;
  zone.on('pointerdown', () => (pressed = true));
  zone.on('pointerup', () => {
    if (pressed) up(true);
    pressed = false;
  });
  zone.on('pointerout', () => {
    if (pressed) up(false);
    pressed = false;
  });
  return c;
}
