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

/** extra: a whole-number magnification for this scene (the garden draws at 2x). */
export function setupView(scene: Phaser.Scene, extra = 1): View {
  const zoom: number = (scene.registry.get('zoom') ?? 1) * extra;
  const W: number = Math.floor((scene.registry.get('W') ?? scene.scale.width) / extra);
  const H: number = Math.floor((scene.registry.get('H') ?? scene.scale.height) / extra);
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0).setZoom(zoom).setScroll(0, 0).setRoundPixels(true);
  return { W, H, zoom };
}
