import Phaser from 'phaser';

/**
 * The canvas runs at full phone resolution so text is sharp,
 * and each scene's camera zooms by a whole number so pixel art stays blocky.
 * Scenes lay things out in small "game pixels" (about 180x320) using W and H.
 */
export interface View {
  W: number;
  H: number;
  zoom: number;
}

export function setupView(scene: Phaser.Scene): View {
  const zoom: number = scene.registry.get('zoom') ?? 1;
  const W: number = scene.registry.get('W') ?? scene.scale.width;
  const H: number = scene.registry.get('H') ?? scene.scale.height;
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0).setZoom(zoom).setScroll(0, 0).setRoundPixels(true);
  return { W, H, zoom };
}
