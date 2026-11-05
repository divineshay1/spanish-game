let el: HTMLDivElement | null = null;
let t: ReturnType<typeof setTimeout> | undefined;

/** A short message at the top of the screen. */
export function toast(msg: string, ms = 1800): void {
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(t);
  t = setTimeout(() => el?.classList.remove('show'), ms);
}
