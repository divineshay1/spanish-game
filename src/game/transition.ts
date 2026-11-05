import Phaser from 'phaser';
import { state } from '../state/store';

/** Soft fade through cream between scenes (instant with reduce motion). */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  if (state().settings.reduceMotion) {
    scene.scene.start(key, data);
    return;
  }
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(220, 246, 228, 248);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
}

export function fadeIn(scene: Phaser.Scene): void {
  if (!state().settings.reduceMotion) scene.cameras.main.fadeIn(260, 246, 228, 248);
}
