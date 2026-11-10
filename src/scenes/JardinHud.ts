import Phaser from 'phaser';
import { PAL, hex } from '../game/palette';
import { setupView } from '../game/view';
import { pixelText } from '../game/text';
import { pixelButton } from '../game/button';
import { goTo } from '../game/transition';
import { state, subscribe } from '../state/store';
import { dueList, seedsLeftToday } from '../engine/cards';
import { focusPool } from '../engine/focus';
import { openFocus, openPlant, openWater, sessionOpen, type SessionResult } from '../ui/session';
import { openSettings } from '../ui/settings';
import { openCoaster, coasterOpen } from '../ui/coaster';
import { getDayOffset, setDayOffset } from '../engine/clock';
import { toast } from '../ui/toast';
import { BOTTOM_BAR, type JardinScene } from './JardinScene';

/** The garden's buttons, fixed on screen while the plants scroll. */
export class JardinHud extends Phaser.Scene {
  constructor() {
    super('JardinHud');
  }

  create(data?: { open?: string }): void {
    const { W, H } = setupView(this);
    const build = () => {
      this.children.removeAll(true);
      const S = state();
      const due = dueList(S).length;
      const seeds = seedsLeftToday(S);
      const planted = Object.keys(S.cards).length;
      const rescue = Object.keys(S.miss).length;

      // top bar
      const top = this.add.graphics();
      top.fillStyle(hex(PAL.plum)).fillRect(0, 0, W, 27);
      top.fillStyle(hex(PAL.lavender)).fillRect(0, 0, W, 26);
      top.fillStyle(hex(PAL.lilac)).fillRect(0, 0, W, 1);
      const back = this.add.image(13, 13, 'back-arrow');
      this.add.zone(14, 13, 30, 28).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (!sessionOpen() && !coasterOpen()) goTo(this.scene.get('Jardin'), 'Cielo');
      });
      void back;
      pixelText(this, W / 2, 9, 'El Jardín', 8, PAL.white, PAL.plum);
      pixelText(this, W / 2, 19, `${planted} plantas · ${due} con sed`, 8, PAL.cream, PAL.deepLav);
      this.add.image(W - 13, 13, 'gear');
      this.add.zone(W - 14, 13, 30, 28).setInteractive({ useHandCursor: true }).on('pointerup', () => openSettings());

      // bottom bar
      const by = H - BOTTOM_BAR;
      const bar = this.add.graphics();
      bar.fillStyle(hex(PAL.plum)).fillRect(0, by, W, BOTTOM_BAR);
      bar.fillStyle(hex(PAL.blush)).fillRect(0, by + 1, W, BOTTOM_BAR - 1);
      bar.fillStyle(hex(PAL.pink)).fillRect(0, by + 1, W, 1);
      const gap = 4;
      const n = 3;
      const bw = Math.floor((W - gap * (n + 1)) / n);
      const bh = 26;
      const y = by + 8;
      const after = (r: SessionResult) => {
        (this.scene.get('Jardin') as JardinScene).afterSession(r);
        if (r.xp) toast(`+${r.xp} XP ✦`);
      };
      pixelButton(this, gap, y, bw, bh, 'Regar', () => openWater(after), { icon: 'can', badge: due ? String(Math.min(due, 99)) : undefined, face: due ? PAL.white : PAL.cream });
      pixelButton(this, gap * 2 + bw, y, bw, bh, 'Sembrar', () => openPlant(after), { icon: 'seed-bag', badge: seeds ? String(seeds) : undefined });
      pixelButton(this, gap * 3 + bw * 2, y, bw, bh, 'Focus', () => openFocus(after), {
        icon: 'can-gold',
        badge: rescue ? String(Math.min(rescue, 99)) : undefined,
        face: focusPool(S).length ? PAL.cream : PAL.rose,
      });

      // La Montaña Rusa: a 10-word ride with Brote
      pixelButton(this, 4, 32, 62, 18, 'Montaña ✦', () => !sessionOpen() && !coasterOpen() && openCoaster(after), { face: PAL.star });

      // hidden test tool: add ?debug to the address to travel in time
      if (new URLSearchParams(location.search).has('debug')) {
        pixelButton(this, W - 52, 32, 48, 16, `día +${getDayOffset()}`, () => {
          setDayOffset(getDayOffset() + 1);
          (this.scene.get('Jardin') as JardinScene).layout();
          build();
          toast(`Time travel: +${getDayOffset()} days`);
        });
      }
    };
    build();
    // opened from the daily route: start that activity right away
    const after0 = (r: SessionResult) => {
      (this.scene.get('Jardin') as JardinScene).afterSession(r);
      if (r.xp) toast(`+${r.xp} XP ✦`);
    };
    if (data?.open) this.time.delayedCall(450, () => {
      if (data.open === 'plant') openPlant(after0);
      else if (data.open === 'water') openWater(after0);
      else if (data.open === 'focus') openFocus(after0);
    });
    const off = subscribe(build);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }
}
