import Phaser from 'phaser';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './style.css';
import './ui/ui.css';
import { initStore, state } from './state/store';
import { applyTextSize } from './ui/settings';
import { setDayOffset } from './engine/clock';
import { unlockAudio } from './audio/sfx';
import { registerSW } from 'virtual:pwa-register';
import { BootScene } from './scenes/BootScene';
import { CieloScene } from './scenes/CieloScene';
import { JardinScene } from './scenes/JardinScene';
import { JardinHud } from './scenes/JardinHud';
import { ClinicaScene } from './scenes/ClinicaScene';
import { fitPixels } from './game/pixelScale';
import { PAL } from './game/palette';

function measure() {
  const vv = window.visualViewport;
  return fitPixels(vv?.width ?? window.innerWidth, vv?.height ?? window.innerHeight, window.devicePixelRatio || 1);
}

function storeView(game: Phaser.Game, fit: ReturnType<typeof fitPixels>) {
  game.registry.set('W', fit.width);
  game.registry.set('H', fit.height);
  game.registry.set('zoom', fit.zoom);
}

function applyCss(game: Phaser.Game, fit: ReturnType<typeof fitPixels>) {
  const c = game.canvas;
  c.style.width = `${fit.cssWidth}px`;
  c.style.height = `${fit.cssHeight}px`;
  game.scale.refresh();
}

async function start() {
  // wait for the pixel font so the first frame has real text
  try {
    await Promise.race([
      Promise.all([document.fonts.load('8px "Pixelify Sans"', 'ñá'), document.fonts.load('bold 8px "Pixelify Sans"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back to monospace */
  }

  await initStore();
  applyTextSize();
  // hidden test switch: ?day=+3 pretends it is 3 days later
  const dayParam = new URLSearchParams(location.search).get('day');
  if (dayParam) setDayOffset(parseInt(dayParam, 10) || 0);

  let fit = measure();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // full device resolution; scenes zoom their camera by fit.zoom
    width: fit.width * fit.zoom,
    height: fit.height * fit.zoom,
    backgroundColor: PAL.blush,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.NONE },
    fps: { target: 60 },
    scene: [BootScene, CieloScene, JardinScene, JardinHud, ClinicaScene],
    callbacks: { preBoot: (g) => storeView(g, fit) },
  });
  game.events.once(Phaser.Core.Events.READY, () => applyCss(game, fit));
  Object.assign(window as object, { __game: game, __state: state });

  let timer = 0;
  const onResize = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const next = measure();
      const sizeChanged = next.width !== fit.width || next.height !== fit.height || next.zoom !== fit.zoom;
      fit = next;
      if (sizeChanged) {
        storeView(game, fit);
        game.scale.resize(fit.width * fit.zoom, fit.height * fit.zoom);
        for (const key of ['Cielo', 'Jardin', 'Clinica']) {
          const sc = game.scene.getScene(key);
          if (sc?.scene.isActive()) sc.scene.restart();
        }
      }
      applyCss(game, fit);
    }, 120);
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
}

// iPhone only plays sound after a tap
window.addEventListener('pointerdown', unlockAudio, { once: true });

registerSW({ immediate: true });
start();
