import Phaser from 'phaser';
import { PAL } from '../game/palette';
import { companion, door, dot, gear, glow, island, moon, sparkleBig, sparkleSmall, starGold } from '../art/sprites';

/** Builds all placeholder textures once, then opens El Cielo. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
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
    add('door-garden', door(PAL.mint));
    add('door-clinic', door(PAL.blush));
    add('door-tower', door(PAL.lavender));
    add('gear', gear());
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
