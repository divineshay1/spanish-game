import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { pixelButton } from '../game/button';
import { goTo, fadeIn } from '../game/transition';
import { state, commit, subscribe } from '../state/store';
import { STORIES } from '../content';
import { libraryCanvas, bookCanvas, LEVEL_COL } from '../art/library';
import { openReader, openOrder, readerOpen } from '../ui/reader';
import { timesRead } from '../engine/reading';
import { sfx } from '../audio/sfx';

/** La Biblioteca: pick a story book from the shelf. */
export class BibliotecaScene extends Phaser.Scene {
  constructor() {
    super('Biblioteca');
  }

  create(data?: { open?: string }): void {
    const { W, H } = setupView(this);
    const shelfY = Math.round(H * 0.42);
    const key = `library-${W}x${H}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, libraryCanvas(W, H, shelfY));
    this.add.image(0, 0, key).setOrigin(0);
    const pal = this.add.sprite(Math.round(W / 2 - 30), H - 47, 'pal-0').play('pal-bob');
    void pal;

    // top bar
    const g = this.add.graphics();
    g.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 25);
    g.fillStyle(hex(PAL.lavender)).fillRect(0, 0, W, 24);
    this.add.image(13, 12, 'back-arrow');
    this.add.zone(14, 12, 30, 26).setInteractive({ useHandCursor: true }).on('pointerup', () => !readerOpen() && goTo(this, 'Cielo'));
    pixelText(this, W / 2, 8, 'La Biblioteca', 8, PAL.white, PAL.plum);
    pixelText(this, W / 2, 18, 'Toca un libro', 8, PAL.cream, PAL.deepLav);

    const books = this.add.container(0, 0);
    const drawBooks = () => {
      books.removeAll(true);
      const S = state();
      const n = STORIES.length;
      const gap = 4;
      const left = Math.round(W / 2 - (n * 18 + (n - 1) * gap) / 2);
      STORIES.forEach((st, i) => {
        const read = timesRead(S, st.id) > 0;
        const k = `book-${st.lvl}-${read ? 1 : 0}`;
        if (!this.textures.exists(k)) this.textures.addCanvas(k, bookCanvas(LEVEL_COL[st.lvl] || PAL.sand, read));
        const x = left + i * (18 + gap) + 9;
        const b = this.add.image(x, shelfY - 15, k).setInteractive({ useHandCursor: true });
        b.on('pointerup', () => {
          if (readerOpen()) return;
          sfx('tap');
          this.tweens.add({ targets: b, y: b.y - 4, duration: 90, yoyo: true });
          openReader(st.id);
        });
        books.add([b, pixelText(this, x, shelfY + 12, st.lvl, 8, PAL.plum, PAL.cream)]);
      });
    };
    drawBooks();

    // bottom buttons: reading mode and the order puzzle
    const bar = this.add.container(0, 0);
    const drawBar = () => {
      bar.removeAll(true);
      const S = state();
      const bw = Math.floor((W - 18) / 2);
      bar.add(
        pixelButton(this, 6, H - 32, bw, 24, S.imm ? 'Inmersión' : 'Normal', () => {
          S.imm = !S.imm;
          commit();
        }, { face: S.imm ? PAL.star : PAL.white }),
      );
      bar.add(pixelButton(this, 12 + bw, H - 32, bw, 24, 'Ordena', () => !readerOpen() && openOrder()));
      const tip = S.imm ? 'Sin inglés: listen first,\nread when ready' : 'Tap a book, then tap\nany word for its meaning';
      const pg = this.add.graphics();
      const py = Math.round(H * 0.42) + 28;
      pg.fillStyle(hex(PAL.plum)).fillRect(W / 2 - 58, py - 1, 116, 26);
      pg.fillStyle(hex(PAL.white)).fillRect(W / 2 - 57, py, 114, 24);
      bar.add([pg, pixelText(this, W / 2, py + 12, tip, 8, PAL.plum, PAL.cream)]);
    };
    drawBar();
    const off = subscribe(() => {
      drawBooks();
      drawBar();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    fadeIn(this);
    if (data?.open === 'read') this.time.delayedCall(400, () => openReader(STORIES.find((s) => !timesRead(state(), s.id))?.id ?? STORIES[0].id));
  }
}
