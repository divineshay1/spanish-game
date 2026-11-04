import Phaser from 'phaser';
import { PAL } from './palette';

export const FONT = '"Pixelify Sans", monospace';

/** Pixel text with a 1px drop shadow so it reads on any sky. */
export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 8,
  color: string = PAL.white,
  shadow: string = PAL.plum,
): Phaser.GameObjects.Container {
  // draw the letters at full screen sharpness (the camera zooms the game up)
  const resolution: number = scene.registry.get('zoom') ?? 1;
  const style: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: FONT, fontSize: `${size}px`, color, resolution };
  const back = scene.add.text(1, 1, text, { ...style, color: shadow }).setOrigin(0.5);
  const front = scene.add.text(0, 0, text, style).setOrigin(0.5);
  return scene.add.container(Math.round(x), Math.round(y), [back, front]);
}
