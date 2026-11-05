/**
 * Stops taps on a DOM panel from reaching the game underneath.
 * (Phaser also listens on the window, so taps would otherwise press
 * whatever button sits under the panel.)
 */
export function shield(el: HTMLElement): void {
  for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'])
    el.addEventListener(type, (e) => e.stopPropagation());
}
