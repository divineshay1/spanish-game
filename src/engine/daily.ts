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
  { key: 'clinica', name: 'La Clínica', door: PAL.blush, scene: 'Clinica', milestone: 'M5' },
  { key: 'observatorio', name: 'Observatorio', door: PAL.lavender, scene: 'Observatorio', milestone: 'M8' },
  { key: 'biblioteca', name: 'Biblioteca', door: PAL.sand, scene: 'Biblioteca', milestone: 'M6' },
  { key: 'isla', name: 'La Isla', door: '#7cc8ff', scene: 'Isla', milestone: 'M7' },
  { key: 'duelo', name: 'El Duelo', door: PAL.deepLav, scene: 'Duelo', milestone: 'M9' },
  { key: 'cafe', name: 'El Café', door: PAL.clay, scene: 'Cafe', milestone: 'M10' },
  { key: 'barrio', name: 'El Barrio', door: PAL.pink, scene: null, milestone: 'M11' },
];

export interface Task {
  id: string;
  t: string;
  d: string;
  /** what to do when tapped */
  go: 'phrase' | 'plant' | 'water' | 'focus' | 'clinic' | 'read' | 'imm' | 'grammar' | 'duel' | 'cafe' | null;
  icon: string;
}

export const TASKS: Task[] = [
  { id: 'phrase', t: 'Frase del día', d: "Listen to today's phrase", go: 'phrase', icon: '☾' },
  { id: 'plant', t: 'Sembrar', d: "Plant today's new words", go: 'plant', icon: '🌱' },
  { id: 'review', t: 'Regar', d: 'Water your thirsty plants', go: 'water', icon: '💧' },
  { id: 'focus', t: 'Focus', d: 'Rescue words you keep missing', go: 'focus', icon: '✦' },
  { id: 'clinic', t: 'La Clínica', d: 'See a patient, all in Spanish', go: 'clinic', icon: '✚' },
  { id: 'read', t: 'Leer', d: 'Read a story, tap any word', go: 'read', icon: '❀' },
  { id: 'inmersion', t: 'Inmersión', d: '10 minutes, Spanish only', go: 'imm', icon: '☾' },
  { id: 'grammar', t: 'Observatorio', d: 'One grammar drill', go: 'grammar', icon: '✧' },
  { id: 'duel', t: 'El Duelo', d: 'A card battle powered by your words', go: 'duel', icon: '⚔' },
  { id: 'cafe', t: 'El Café', d: 'Listen to orders and serve them', go: 'cafe', icon: '☕' },
];

/** Steps coming with later realms, shown greyed out. */
export const SOON_TASKS: [string, string][] = [
  ['El Barrio', 'Walk the neighbourhood and talk'],
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
