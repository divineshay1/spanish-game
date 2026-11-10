/**
 * La Montaña Rusa: a 10-word ride. Each right answer rolls Brote's cart to
 * the next flag; a miss never rolls back, the word just comes round again.
 * Uses your garden's words (thirsty ones first) and waters them.
 */
import { catalog } from './cards';
import { dayKey } from './clock';
import { rate } from './srs';
import { cleanEs, shuffle } from './text';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

/** [Spanish, English, card id when it is one of your plants] */
export type RideWord = [string, string, string?];

export const RIDE_LEN = 10;

/** Starter words when the garden is still small. */
export const STARTER: RideWord[] = [
  ['el corazón', 'heart'], ['la tos', 'cough'], ['la fiebre', 'fever'], ['la cabeza', 'head'], ['la espalda', 'back'],
  ['la garganta', 'throat'], ['el estómago', 'stomach'], ['la alergia', 'allergy'], ['el mareo', 'dizziness'], ['la herida', 'wound'],
];

const fits = (es: string, en: string) => es.length <= 24 && en.length <= 26;

/** Ten words: your plants first (thirsty, then the rest), topped up with starter words. */
export function rideWords(S: State, key: string = dayKey()): RideWord[] {
  const planted = catalog(S).filter((c) => S.cards[c.id] && fits(cleanEs(c.es), c.en));
  const thirsty = planted.filter((c) => S.cards[c.id].due <= key);
  const rest = planted.filter((c) => S.cards[c.id].due > key);
  const mine: RideWord[] = [...shuffle(thirsty), ...shuffle(rest)].slice(0, RIDE_LEN).map((c) => [cleanEs(c.es), c.en, c.id]);
  const seen = new Set(mine.map((w) => w[1].toLowerCase()));
  for (const w of shuffle(STARTER)) {
    if (mine.length >= RIDE_LEN) break;
    if (!seen.has(w[1])) mine.push(w), seen.add(w[1]);
  }
  return mine;
}

/** Four meanings: the right one plus three others from the ride, then your catalog. */
export function choices(S: State, w: RideWord, ride: RideWord[]): string[] {
  const right = w[1];
  const others = new Set<string>();
  for (const x of shuffle(ride)) if (x[1] !== right) others.add(x[1]);
  if (others.size < 3) for (const c of shuffle(catalog(S)).slice(0, 40)) if (c.en !== right && c.en.length <= 26) others.add(c.en);
  return shuffle([right, ...[...others].slice(0, 3)]);
}

/** A right answer: waters the plant if it was thirsty, once per ride. Returns true if it grew. */
export function rideRight(S: State, w: RideWord, watered: Set<string>, when: Date = new Date()): boolean {
  recMod(S, 'coaster', true);
  const id = w[2];
  if (!id || watered.has(id)) return false;
  const st = S.cards[id];
  if (!st || st.due > dayKey(when)) return false;
  watered.add(id);
  S.cards[id] = rate(st, 'good', when);
  return true;
}

export const rideMiss = (S: State) => recMod(S, 'coaster', false);

/** XP for a finished ride: 1 per word plus 5 for reaching the gate. */
export function finishRide(S: State, right: number, reachedEnd: boolean): number {
  const xp = right + (reachedEnd ? 5 : 0);
  if (xp) addXP(S, xp, 'coaster');
  return xp;
}
