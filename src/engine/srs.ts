/**
 * Spaced repetition (Leitner boxes), exactly as in the prototype:
 * 9 boxes (0..8) with gaps of [0,1,2,4,8,16,35,70,140] days and about
 * 10% random wiggle on gaps of 16 days or more.
 * In El Jardín the box is the plant's growth stage.
 */
import { addDays, daysBetween, dayKey, now } from './clock';

export const INT = [0, 1, 2, 4, 8, 16, 35, 70, 140] as const;
export const MAXBOX = 8;

export interface CardState {
  box: number;
  /** "YYYY-MM-DD" day it is next due */
  due: string;
  /** times answered */
  seen: number;
}

export type Rating = 'again' | 'good' | 'easy';

/** A miss: box 5+ halves, box 2-4 drops one, otherwise back to 0. */
export const lapse = (b: number): number => (b >= 5 ? Math.floor(b / 2) : b >= 2 ? b - 1 : 0);

/** Gap in days for a box, with wiggle on long gaps. */
export function gapDays(box: number, rand: () => number = Math.random): number {
  const n = INT[Math.min(MAXBOX, Math.max(0, box))];
  return n >= 16 ? Math.round(n * (0.9 + rand() * 0.2)) : n;
}

export const dueIn = (box: number, from: Date = now(), rand: () => number = Math.random): string =>
  addDays(gapDays(box, rand), from);

/** New state after answering. Mirrors applyRate() in the prototype. */
export function rate(prev: CardState | undefined, r: Rating, from: Date = now(), rand: () => number = Math.random): CardState {
  const st: CardState = prev ? { ...prev } : { box: 0, due: '', seen: 0 };
  st.seen++;
  if (r === 'again') {
    st.box = lapse(st.box);
    st.due = dayKey(from);
  } else {
    st.box = Math.min(MAXBOX, st.box + (r === 'easy' ? 2 : 1));
    st.due = dueIn(st.box, from, rand);
  }
  return st;
}

export const isDue = (c: CardState, today: string = dayKey()): boolean => c.due <= today;

/**
 * How thirsty a plant is: 0 = fine, 1 = due today (droops),
 * 2 = overdue by more than its own gap (fades). Never dies.
 */
export function thirst(c: CardState, today: string = dayKey()): 0 | 1 | 2 {
  if (!c.due || c.due > today) return 0;
  const late = daysBetween(c.due, today);
  const gap = Math.max(1, INT[Math.min(MAXBOX, c.box)]);
  return late > gap ? 2 : 1;
}
