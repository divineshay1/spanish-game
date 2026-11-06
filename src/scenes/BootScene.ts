import Phaser from 'phaser';
import artKeys from 'virtual:art-manifest';
import { PAL } from '../game/palette';
import { backArrow, companion, dot, drop, gear, glow, grassTile, island, moon, seedBag, sparkleBig, sparkleSmall, starGold, wateringCan } from '../art/sprites';

/** Builds all placeholder textures once, then opens El Cielo. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  /** Real art from public/assets (see ART_PROMPTS.md) loads first and wins. */
  preload(): void {
    for (const key of artKeys) this.load.image(key, `assets/${key}.png`);
  }

  create(): void {
    const add = (key: string, c: HTMLCanvasElement) => {
      if (!this.textures.exists(key)) this.textures.addCanvas(key, c);
    };
    add('sparkle-s', sparkleSmall());
    add('sparkle-b', sparkleBig());
    add('star-gold', starGold());
    add('dot-white', dot(PAL.white));
    add('dot-star', dot(PAL.star));
    add('dot-lilac', dot(PAL.lilac));
    add('moon', moon(15));
    add('moon-glow', glow(41, PAL.white));
    add('island', island(120, 64));
    add('gear', gear());
    add('back-arrow', backArrow());
    add('can', wateringCan());
    add('can-gold', wateringCan(true));
    add('seed-bag', seedBag());
    add('drop', drop());
    add('grass', grassTile());
    add('pal-0', companion(0));
    add('pal-1', companion(1));
    this.anims.create({
      key: 'pal-bob',
      frames: [{ key: 'pal-0' }, { key: 'pal-1' }],
      frameRate: 2,
      repeat: -1,
    });
    this.scene.start('Cielo');
  }
}
