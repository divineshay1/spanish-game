/**
 * Watering (review) and planting sessions for El Jardín.
 * Same rules as the prototype's Repaso: up to 20 due cards, weakest first;
 * four test modes; a miss goes back into the queue; +2 XP per right answer.
 */
import { type Card, catalog, dueList, seedList, seedsLeftToday } from './cards';
import { dayKey, now } from './clock';
import { enAlts, gradeTyped, type Grade } from './grading';
import { rate, type Rating } from './srs';
import { cleanEs, shuffle, stripArt } from './text';
import type { State } from '../state/state';
import { addXP, recMod, recWord } from '../state/progress';

export type TestMode = 'flash' | 'mc' | 'rtr' | 'rwd';

export const TEST_MODES: [TestMode, string, string][] = [
  ['flash', 'Flashcards', 'Flip the card, then rate yourself'],
  ['mc', 'Multiple choice', 'Pick the right answer'],
  ['rtr', 'Recall the translation', 'See the Spanish, type the English'],
  ['rwd', 'Recall the word', 'See the English, type the Spanish'],
];

export interface Session {
  kind: 'water' | 'plant';
  mode: TestMode;
  queue: Card[];
  i: number;
  xp: number;
  right: number;
  /** card ids whose plant grew or shrank, for the garden animation */
  grew: string[];
  shrank: string[];
}

/** Due plants, weakest first, at most 20 (prototype rule). */
export function waterQueue(S: State, rand: () => number = Math.random, key: string = dayKey()): Card[] {
  return shuffle(dueList(S, key), rand)
    .sort((a, b) => S.cards[a.id].box - S.cards[b.id].box)
    .slice(0, 20);
}

/** Today's new seeds (5 a day by default). */
export function seedQueue(S: State, key: string = dayKey()): Card[] {
  return seedList(S).slice(0, seedsLeftToday(S, key));
}

export function startSession(kind: Session['kind'], queue: Card[], mode: TestMode): Session {
  return { kind, mode, queue: queue.slice(), i: 0, xp: 0, right: 0, grew: [], shrank: [] };
}

export const current = (s: Session): Card | undefined => s.queue[s.i];
export const done = (s: Session): boolean => s.i >= s.queue.length;

export interface Prompt {
  /** 'es': show Spanish, answer in English. 'en': show English, answer in Spanish. */
  dir: 'es' | 'en';
  /** multiple-choice options */
  opts: string[];
  /** the right option or typed answer to show */
  answer: string;
}

/** Sets up one question, mirroring revPrep() in the prototype. */
export function prompt(S: State, c: Card, mode: TestMode, rand: () => number = Math.random): Prompt {
  const dir: Prompt['dir'] = mode === 'rtr' ? 'es' : mode === 'rwd' ? 'en' : rand() < 0.5 ? 'es' : 'en';
  const es = cleanEs(c.es);
  let opts: string[] = [];
  if (mode === 'mc') {
    const others = shuffle(
      catalog(S).filter((x) => x.id !== c.id),
      rand,
    );
    const o: string[] = [];
    if (dir === 'es') {
      for (const x of others) if (o.length < 3 && x.en !== c.en && !o.includes(x.en)) o.push(x.en);
      opts = shuffle([c.en, ...o], rand);
    } else {
      for (const x of others) {
        const e = cleanEs(x.es);
        if (o.length < 3 && e !== es && !o.includes(e)) o.push(e);
      }
      opts = shuffle([es, ...o], rand);
    }
  }
  return { dir, opts, answer: dir === 'es' ? c.en : es };
}

/** Grades a typed answer the way the prototype did. */
export function checkTyped(c: Card, mode: 'rtr' | 'rwd', typed: string): Grade {
  if (mode === 'rtr') return gradeTyped(typed.replace(/^(to|the|a|an) /i, ''), enAlts(c.en), false);
  const es = cleanEs(c.es);
  return gradeTyped(typed, [es, stripArt(es)], true);
}

/** A typed grade counts as right unless it is 'bad' (or the "I was right" button was used). */
export const typedRating = (g: Grade, override = false): Rating => (g !== 'bad' || override ? 'good' : 'again');

/**
 * Records an answer: moves the plant up or down a stage, tracks misses and skill
 * stats, and puts missed cards back at the end of the queue.
 */
export function answer(S: State, s: Session, r: Rating, when: Date = now(), rand: () => number = Math.random): void {
  const c = s.queue[s.i];
  if (!c) return;
  const ok = r !== 'again';
  const before = S.cards[c.id]?.box ?? 0;
  recMod(S, s.kind === 'plant' ? 'plant' : 'review', ok);
  recWord(S, c.id, c.es, c.en, ok);
  const wasNew = !S.cards[c.id];
  S.cards[c.id] = rate(S.cards[c.id], r, when, rand);
  if (wasNew) {
    const k = dayKey(when);
    S.planted[k] = (S.planted[k] || 0) + 1;
    if (c.family === 'imagen' && c.pic) S.imgSeen[c.pic] = true;
  }
  const after = S.cards[c.id].box;
  if (after > before) s.grew.push(c.id);
  else if (after < before) s.shrank.push(c.id);
  if (ok) {
    s.xp += 2;
    s.right++;
  } else if (s.kind === 'water') s.queue.push(c); // try it again at the end
  s.i++;
}

/** Ends a session and banks the XP. */
export function finish(S: State, s: Session): void {
  if (s.xp > 0) addXP(S, s.xp, s.kind === 'plant' ? 'plant' : 'review');
}
