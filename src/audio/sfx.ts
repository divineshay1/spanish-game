/**
 * Tiny chiptune sound effects and a soft ambient loop, made with WebAudio
 * (no audio files). iPhone only allows sound after a tap, so the audio
 * starts on the first touch.
 */
import { state } from '../state/store';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

/** Call from a tap handler: wakes audio up on iPhone. */
export function unlockAudio(): void {
  const c = ac();
  if (c && c.state === 'suspended') void c.resume();
  if (state().settings.music) startMusic();
}

type Wave = OscillatorType;
function note(freq: number, at: number, dur: number, vol = 0.12, wave: Wave = 'square', slideTo?: number): void {
  const c = ac();
  if (!c || !master) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + dur + 0.02);
}

const N = (semi: number) => 523.25 * Math.pow(2, semi / 12); // from C5

export type Sfx = 'tap' | 'good' | 'bad' | 'grow' | 'plant' | 'door' | 'sparkle' | 'locked' | 'done';

export function sfx(kind: Sfx): void {
  if (!state().settings.sfx) return;
  const c = ac();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime + 0.01;
  switch (kind) {
    case 'tap':
      note(N(7), t, 0.05, 0.06, 'square');
      break;
    case 'good':
      note(N(4), t, 0.08, 0.09);
      note(N(7), t + 0.07, 0.08, 0.09);
      note(N(12), t + 0.14, 0.16, 0.09);
      break;
    case 'bad':
      note(N(-5), t, 0.18, 0.07, 'triangle', N(-9));
      break;
    case 'grow':
      [0, 4, 7, 11, 14].forEach((s, i) => note(N(s), t + i * 0.06, 0.12, 0.07, 'triangle'));
      break;
    case 'plant':
      note(N(-12), t, 0.08, 0.1, 'triangle');
      note(N(0), t + 0.06, 0.12, 0.08, 'triangle');
      break;
    case 'door':
      [12, 7, 16, 19].forEach((s, i) => note(N(s), t + i * 0.05, 0.14, 0.06, 'square'));
      break;
    case 'sparkle':
      note(N(19), t, 0.06, 0.05, 'square');
      note(N(24), t + 0.05, 0.1, 0.04, 'square');
      break;
    case 'locked':
      note(N(0), t, 0.06, 0.06, 'square');
      note(N(-1), t + 0.08, 0.1, 0.06, 'square');
      break;
    case 'done':
      [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => note(N(s), t + i * 0.08, 0.14, 0.07, i % 2 ? 'square' : 'triangle'));
      break;
  }
}

// ---- soft ambient loop: slow pentatonic arpeggio, very quiet ----
let musicTimer: ReturnType<typeof setInterval> | null = null;
let step = 0;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const PATTERN = [0, 2, 4, 5, 4, 2, 1, 3, 0, 2, 4, 6, 5, 3, 2, 1];
const CHORDS = [-12, -15, -8, -10];

export function startMusic(): void {
  const c = ac();
  if (!c || musicTimer) return;
  musicTimer = setInterval(() => {
    if (!ctx || document.hidden) return;
    const t = ctx.currentTime + 0.05;
    const s = PATTERN[step % PATTERN.length];
    note(N(SCALE[s] - 12), t, 1.1, 0.025, 'triangle');
    if (step % 8 === 0) note(N(CHORDS[(step / 8) % CHORDS.length]), t, 3.2, 0.03, 'sine');
    step++;
  }, 420);
}

export function stopMusic(): void {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

export function setMusic(on: boolean): void {
  if (on) startMusic();
  else stopMusic();
}
