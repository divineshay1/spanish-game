/**
 * Today's route (small daily steps), the phrase of the day, and the realm list.
 */
import { pool } from './cards';
import { dayKey, now } from './clock';
import { dueList, seedsLeftToday } from './cards';
import type { State } from '../state/state';
import { today } from '../state/progress';
import { PAL } from '../game/palette';

export interface Realm {
  key: string;
  name: string;
  door: string;
  /** Phaser scene key once the realm is built */
  scene: string | null;
  milestone: string;
}

export const REALMS: Realm[] = [
  { key: 'jardin', name: 'El Jardín', door: PAL.mint, scene: 'Jardin', milestone: 'M3' },
  { key: 'clinica', name: 'La Clínica', door: PAL.blush, scene: null, milestone: 'M5' },
  { key: 'observatorio', name: 'Observatorio', door: PAL.lavender, scene: null, milestone: 'M8' },
  { key: 'biblioteca', name: 'Biblioteca', door: PAL.sand, scene: null, milestone: 'M6' },
  { key: 'isla', name: 'La Isla', door: '#7cc8ff', scene: null, milestone: 'M7' },
  { key: 'duelo', name: 'El Duelo', door: PAL.deepLav, scene: null, milestone: 'M9' },
  { key: 'cafe', name: 'El Café', door: PAL.clay, scene: null, milestone: 'M10' },
  { key: 'barrio', name: 'El Barrio', door: PAL.pink, scene: null, milestone: 'M11' },
];

export interface Task {
  id: string;
  t: string;
  d: string;
  /** what to do when tapped */
  go: 'phrase' | 'plant' | 'water' | 'focus' | null;
  icon: string;
}

export const TASKS: Task[] = [
  { id: 'phrase', t: 'Frase del día', d: "Listen to today's phrase", go: 'phrase', icon: '☾' },
  { id: 'plant', t: 'Sembrar', d: "Plant today's new words", go: 'plant', icon: '🌱' },
  { id: 'review', t: 'Regar', d: 'Water your thirsty plants', go: 'water', icon: '💧' },
  { id: 'focus', t: 'Focus', d: 'Rescue words you keep missing', go: 'focus', icon: '✦' },
];

/** Steps coming with later realms, shown greyed out. */
export const SOON_TASKS: [string, string][] = [
  ['La Clínica', 'See a patient, all in Spanish'],
  ['Leer', 'Read a story, tap any word'],
  ['Inmersión', '10 minutes, Spanish only'],
  ['Observatorio', 'One grammar lesson'],
];

/** Whether a step counts as done today. Nothing due or no seeds left also counts. */
export function taskDone(S: State, id: string, key: string = dayKey()): boolean {
  const t = today(S, key);
  if (t.done[id]) return true;
  if (id === 'review') return dueList(S, key).length === 0 && Object.keys(S.cards).length > 0;
  if (id === 'plant') return seedsLeftToday(S, key) === 0;
  return false;
}

export function tasksDone(S: State, key: string = dayKey()): number {
  return TASKS.filter((t) => taskDone(S, t.id, key)).length;
}

/** Same pick as the prototype: one phrase card per calendar day. */
export function phraseOfDay(S: State, d: Date = now()): { es: string; en: string } {
  const p = pool(S);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return p[Math.floor(day.getTime() / 864e5) % p.length];
}

export const levelProgress = (S: State) => ({ level: Math.floor(S.xp / 250) + 1, into: S.xp % 250, of: 250 });
