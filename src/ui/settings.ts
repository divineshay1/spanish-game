/**
 * Ajustes (settings): name, accent, voice and speed, new seeds per day,
 * text size, motion and sound, and Backup / Restore / Reset.
 * A DOM panel over the game: easier to read and tap than canvas text.
 */
import { commit, replaceState, state } from '../state/store';
import { defaults } from '../state/state';
import { downloadBackup, pickBackupFile } from '../state/backup';
import { flush } from '../state/storage';
import { hasTTS, onVoices, pickVoice, SPEED_CHOICES, spanishVoices, speak } from '../audio/speech';
import { toast } from './toast';
import { setMusic } from '../audio/sfx';
import { shield } from './shield';

let layer: HTMLDivElement | null = null;
let resetArmed = false;
let offVoices: (() => void) | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function applyTextSize(): void {
  document.documentElement.style.setProperty('--text-scale', String(state().settings.textSize));
}

export function openSettings(): void {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ui-layer';
    layer.id = 'settings';
    layer.addEventListener('click', onClick);
    layer.addEventListener('change', onChange);
    shield(layer);
    document.body.appendChild(layer);
  }
  resetArmed = false;
  layer.hidden = false;
  render();
  offVoices = onVoices(render);
}

export function closeSettings(): void {
  if (layer) layer.hidden = true;
  offVoices?.();
  offVoices = null;
  void flush();
}

export const settingsOpen = (): boolean => !!layer && !layer.hidden;

function chip(act: string, value: string | number, label: string, on: boolean): string {
  return `<button class="pbtn${on ? ' on' : ''}" data-act="${act}" data-v="${esc(String(value))}" aria-pressed="${on}">${esc(label)}</button>`;
}

function render(): void {
  if (!layer) return;
  const S = state();
  const v = pickVoice(S);
  const es = spanishVoices();
  const st = S.settings;
  layer.innerHTML = `
  <div class="panel" role="dialog" aria-label="Ajustes">
    <div class="row between"><h2>Ajustes</h2><button class="pbtn small" data-act="close" aria-label="Close">✕ Cerrar</button></div>

    <h3>Tu nombre</h3>
    <input class="pinput" id="set-name" maxlength="24" value="${esc(S.name)}" autocomplete="off" />

    <h3>Acento</h3>
    <p class="muted">Accent for audio and speech</p>
    <div class="row">${chip('accent', 'mx', 'Mexicana', S.accent === 'mx')}${chip('accent', 'co', 'Colombiana', S.accent === 'co')}</div>

    <h3>Velocidad</h3>
    <p class="muted">Audio speed</p>
    <div class="row">${SPEED_CHOICES.map(([l, r]) => chip('rate', r, l, S.rate === r)).join('')}</div>

    <h3>Voz</h3>
    <p class="muted">Voice on this device</p>
    <div class="row">${chip('voice', '', 'Auto', !S.voice)}${es
      .map((x) => chip('voice', x.voiceURI, `${x.name} · ${x.lang.replace('_', '-')}`, S.voice === x.voiceURI))
      .join('')}</div>
    <p class="muted">${
      !hasTTS
        ? 'This browser cannot speak.'
        : v
          ? `Voice: ${esc(v.name)} (${esc(v.lang)})`
          : 'No Spanish voice found on this device yet.'
    }</p>
    <p class="muted">Tip for iPhone: better voices are free. Settings → Accessibility → Spoken Content → Voices → Spanish → download an Enhanced or Premium voice for Mexico or Colombia. Then come back and pick it.</p>
    <div class="row"><button class="pbtn gold" data-act="test">▶ Probar voz</button></div>

    <h3>Semillas nuevas</h3>
    <p class="muted">New words offered each day in El Jardín</p>
    <div class="row">${[3, 5, 8, 10].map((n) => chip('seeds', n, String(n), st.newPerDay === n)).join('')}</div>

    <h3>Texto</h3>
    <div class="row">${[
      [1, 'Normal'],
      [1.25, 'Grande'],
      [1.5, 'Muy grande'],
    ]
      .map(([n, l]) => chip('text', n, String(l), st.textSize === n))
      .join('')}</div>

    <h3>Movimiento y sonido</h3>
    <div class="row">
      ${chip('motion', st.reduceMotion ? 0 : 1, st.reduceMotion ? 'Menos movimiento: sí' : 'Menos movimiento: no', st.reduceMotion)}
      ${chip('sfx', st.sfx ? 0 : 1, st.sfx ? 'Sonidos: sí' : 'Sonidos: no', st.sfx)}
      ${chip('music', st.music ? 0 : 1, st.music ? 'Música: sí' : 'Música: no', st.music)}
    </div>

    <p class="muted">Versión ${esc(__APP_VERSION__)}</p>
    <h3>Tu progreso</h3>
    <p class="muted">Saved on this phone only. Nothing leaves your device. Make a backup now and then.</p>
    <div class="row">
      <button class="pbtn" data-act="backup">⬇ Backup</button>
      <button class="pbtn" data-act="restore">⬆ Restore</button>
      <button class="pbtn danger${resetArmed ? ' armed' : ''}" data-act="reset">${resetArmed ? 'Tap again to erase everything' : 'Reset progress'}</button>
    </div>
  </div>`;
}

async function onClick(e: Event): Promise<void> {
  const target = e.target as HTMLElement;
  if (target === layer) return closeSettings(); // tap outside the panel
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn) return;
  const S = state();
  const v = btn.dataset.v ?? '';
  const act = btn.dataset.act;
  if (act !== 'reset') resetArmed = false;
  switch (act) {
    case 'close':
      return closeSettings();
    case 'accent':
      S.accent = v === 'co' ? 'co' : 'mx';
      break;
    case 'rate':
      S.rate = Number(v);
      speak('Hola', S);
      break;
    case 'voice':
      S.voice = v;
      break;
    case 'test':
      if (!speak('Hola, vamos a practicar español hoy', S)) toast('Audio is not supported here');
      return;
    case 'seeds':
      S.settings.newPerDay = Number(v);
      break;
    case 'text':
      S.settings.textSize = Number(v);
      applyTextSize();
      break;
    case 'motion':
      S.settings.reduceMotion = v === '1';
      break;
    case 'sfx':
      S.settings.sfx = v === '1';
      break;
    case 'music':
      S.settings.music = v === '1';
      setMusic(S.settings.music);
      break;
    case 'backup':
      downloadBackup(S);
      toast('Backup saved ✦');
      return;
    case 'restore': {
      const r = await pickBackupFile();
      if (!r) return;
      if (!r.ok) return toast(r.error, 3200);
      replaceState(r.state);
      applyTextSize();
      toast(r.source === 'mi-espanol' ? 'Mi Español progress restored ✦' : 'Backup restored ✦');
      render();
      return;
    }
    case 'reset':
      if (!resetArmed) {
        resetArmed = true;
        render();
        return;
      }
      resetArmed = false;
      replaceState(defaults());
      applyTextSize();
      toast('Progress erased. A fresh start ✦');
      render();
      return;
  }
  commit();
  render();
}

function onChange(e: Event): void {
  const t = e.target as HTMLInputElement;
  if (t.id === 'set-name') {
    state().name = t.value.trim().slice(0, 24) || 'Sha';
    commit();
  }
}
