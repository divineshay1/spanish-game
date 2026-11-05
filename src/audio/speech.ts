/**
 * Spanish voices from the phone (Web Speech API). Free and offline when the
 * phone has the voice installed. Picks Mexican or Colombian Spanish, as in
 * the prototype, and remembers a chosen voice.
 */
export const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();

function loadVoices(): void {
  if (!hasTTS) return;
  voices = speechSynthesis.getVoices() || [];
  listeners.forEach((f) => f());
}
if (hasTTS) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

/** Calls back when the phone finishes listing its voices. */
export const onVoices = (f: () => void): (() => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

const tag = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-');

/** All Spanish voices on this device. */
export const spanishVoices = (): SpeechSynthesisVoice[] => voices.filter((v) => /^es/i.test(v.lang));

export interface VoicePrefs {
  accent: 'mx' | 'co';
  voice: string;
  rate: number;
}

/** Chosen voice, else the best match for the accent (same order as the prototype). */
export function pickVoice(p: VoicePrefs, list: SpeechSynthesisVoice[] = voices): SpeechSynthesisVoice | null {
  if (p.voice) {
    const sv = list.find((x) => x.voiceURI === p.voice);
    if (sv) return sv;
  }
  const pref = p.accent === 'co' ? ['es-CO', 'es-MX', 'es-US', 'es-419'] : ['es-MX', 'es-US', 'es-419', 'es-CO'];
  for (const code of pref) {
    const v = list.find((x) => tag(x) === code);
    if (v) return v;
  }
  return (
    list.find((v) => /^es/i.test(v.lang) && !/ES$/i.test(tag(v))) || list.find((v) => /^es/i.test(v.lang)) || null
  );
}

export const RATES = { slow: 0.65, natural: 1.05 } as const;
export const SPEED_CHOICES: [label: string, rate: number][] = [
  ['Slow', 0.75],
  ['Normal', 0.9],
  ['Natural', 1.05],
];

export interface SpeakOpts {
  slow?: boolean;
  natural?: boolean;
  pitch?: number;
  onend?: () => void;
}

/** Says Spanish text out loud. Returns false if this device can't speak. */
export function speak(text: string, p: VoicePrefs, o: SpeakOpts = {}): boolean {
  if (!hasTTS) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[✦❀]/g, ''));
    const v = pickVoice(p);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = p.accent === 'co' ? 'es-CO' : 'es-MX';
    u.rate = o.slow ? RATES.slow : o.natural ? RATES.natural : p.rate;
    if (o.pitch) u.pitch = o.pitch;
    if (o.onend) {
      u.onend = o.onend;
      u.onerror = o.onend;
    }
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (hasTTS)
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
}
