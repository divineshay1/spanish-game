/**
 * Everything the game remembers. Same shape as the Mi Español prototype's
 * save (cards with box and due date, XP, streak, misses…) plus a few new
 * settings, so an old Mi Español save can be restored here.
 */
import type { CardState } from '../engine/srs';

export interface DayLog {
  xp: number;
  done: Record<string, boolean>;
}

export interface Settings {
  reduceMotion: boolean;
  /** 1 = normal, 1.25 = large, 1.5 = extra large */
  textSize: number;
  sfx: boolean;
  music: boolean;
  /** new seeds offered per day in El Jardín */
  newPerDay: number;
  /** Estrellas Fugaces: say each new word out loud automatically */
  starsAuto: boolean;
}

export interface State {
  name: string;
  xp: number;
  streak: number;
  best: number;
  last: string;
  days: Record<string, DayLog>;
  cards: Record<string, CardState>;
  saved: Record<string, { es: string; en: string }>;
  stories: Record<string, unknown>;
  lessons: Record<string, unknown>;
  /** 'mx' Mexicana or 'co' Colombiana */
  accent: 'mx' | 'co';
  rate: number;
  goal: number;
  imgSeen: Record<string, boolean>;
  favs: Record<string, boolean>;
  mod: Record<string, { n: number; r: number }>;
  miss: Record<string, { es: string; en: string; c: number }>;
  voice: string;
  expo: Record<string, number>;
  imm: boolean;
  sev: Record<string, unknown>;
  sevDay: Record<string, unknown>;
  sevNew: { d: string; n: number };
  testMode: 'flash' | 'mc' | 'rtr' | 'rwd';
  immData: { min: number; sess: number; help: number; right: number; total: number; days: Record<string, unknown> };
  game: { coins: number; cleared: number; perks: Record<string, unknown>; wins: number; losses: number; played: number };
  clin: { patients: number; stars: number; coins: number; shifts: number };
  cafe: { shifts: number; served: number; stars: number; tips: number };
  barrio: { talks: Record<string, number> };
  settings: Settings;
  /** new seeds planted per day: { "YYYY-MM-DD": count } */
  planted: Record<string, number>;
  _t?: number;
}

export const defaults = (): State => ({
  name: 'Sha',
  xp: 0,
  streak: 0,
  best: 0,
  last: '',
  days: {},
  cards: {},
  saved: {},
  stories: {},
  lessons: {},
  accent: 'mx',
  rate: 0.9,
  goal: 60,
  imgSeen: {},
  favs: {},
  mod: {},
  miss: {},
  voice: '',
  expo: {},
  imm: false,
  sev: {},
  sevDay: {},
  sevNew: { d: '', n: 0 },
  testMode: 'flash',
  immData: { min: 0, sess: 0, help: 0, right: 0, total: 0, days: {} },
  game: { coins: 0, cleared: 0, perks: {}, wins: 0, losses: 0, played: 0 },
  clin: { patients: 0, stars: 0, coins: 0, shifts: 0 },
  cafe: { shifts: 0, served: 0, stars: 0, tips: 0 },
  barrio: { talks: {} },
  settings: { reduceMotion: false, textSize: 1, sfx: true, music: false, newPerDay: 5, starsAuto: true },
  planted: {},
});

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Fills in anything missing so older saves keep working. */
export function mergeState(raw: unknown): State {
  const d = defaults();
  if (!isObj(raw)) return d;
  const out = { ...d, ...raw } as State;
  // nested groups: keep new default fields
  out.immData = { ...d.immData, ...(isObj(raw.immData) ? raw.immData : {}) } as State['immData'];
  out.game = { ...d.game, ...(isObj(raw.game) ? raw.game : {}) } as State['game'];
  out.clin = { ...d.clin, ...(isObj(raw.clin) ? raw.clin : {}) } as State['clin'];
  out.cafe = { ...d.cafe, ...(isObj(raw.cafe) ? raw.cafe : {}) } as State['cafe'];
  out.barrio = { talks: isObj(raw.barrio) && isObj(raw.barrio.talks) ? (raw.barrio.talks as Record<string, number>) : {} };
  out.settings = { ...d.settings, ...(isObj(raw.settings) ? raw.settings : {}) } as Settings;
  out.sevNew = { ...d.sevNew, ...(isObj(raw.sevNew) ? raw.sevNew : {}) } as State['sevNew'];
  if (out.accent !== 'mx' && out.accent !== 'co') out.accent = 'mx';
  // drop malformed cards instead of crashing later
  const cards: Record<string, CardState> = {};
  if (isObj(raw.cards))
    for (const [k, v] of Object.entries(raw.cards)) {
      if (!isObj(v)) continue;
      const box = Number(v.box);
      if (!Number.isFinite(box)) continue;
      cards[k] = {
        box: Math.max(0, Math.min(8, Math.round(box))),
        due: typeof v.due === 'string' ? v.due : '',
        seen: Number(v.seen) || 0,
      };
    }
  out.cards = cards;
  for (const k of ['days', 'saved', 'stories', 'lessons', 'imgSeen', 'favs', 'mod', 'miss', 'expo', 'sev', 'sevDay', 'planted'] as const)
    if (!isObj(out[k])) (out as unknown as Record<string, unknown>)[k] = {};
  return out;
}
