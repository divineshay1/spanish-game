/**
 * Pensar: think it through. Pattern lessons (the prototype's 8 plus the
 * "palabras gemelas" patterns): see the English, think of the Spanish, reveal,
 * and say honestly if you knew it.
 */
import { LESSONS } from '../content';
import { COGNATES } from '../content/cognates';
import { shuffle } from './text';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

export interface ThinkLesson { id: string; title: string; rule: string; items: [string, string][]; twin: boolean }

/** All lessons; prototype items are [English, Spanish] too. */
export const THINK: ThinkLesson[] = [
  ...LESSONS.map((l) => ({ id: l.id, title: l.title, rule: l.rule, items: l.items, twin: false })),
  ...COGNATES.map((c) => ({ ...c, twin: true })),
];

/** Up to 10 items in random order (the long twin lists would be tiring all at once). */
export const thinkRound = (l: ThinkLesson, r: () => number = Math.random): [string, string][] => shuffle(l.items, r).slice(0, 10);

export function thinkAnswer(S: State, knew: boolean): void {
  recMod(S, 'think', knew);
}

/** XP as in the prototype: 15 + 2 per word you knew. */
export function finishThink(S: State, l: ThinkLesson, got: number): number {
  const xp = 15 + got * 2;
  S.lessons[l.id] = true;
  addXP(S, xp, 'grammar');
  return xp;
}
