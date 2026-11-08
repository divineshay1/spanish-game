/**
 * La Biblioteca: stories with tap-for-meaning, a no-English immersion mode,
 * saving words to the garden, and putting a story back in order.
 * Ported from the prototype's Leer screen.
 */
import { DICT, RAIZ, STORIES, type Story } from '../content';
import { dayKey } from './clock';
import { shuffle } from './text';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

export interface Token {
  pre: string;
  word: string;
  post: string;
}

/** Splits a sentence into tappable words, keeping punctuation outside them. */
export function tokens(sentence: string): Token[] {
  return sentence.split(' ').map((t) => {
    const m = t.match(/^([¿¡"“«(]*)(.*?)([.,;:!?"”»)…]*)$/)!;
    return { pre: m[1], word: m[2], post: m[3] };
  });
}

/** The prototype's word meaning, if there is one. */
export const gloss = (word: string): string | undefined => DICT[word.toLowerCase()];

/** Little words (pronouns, articles, prepositions) that are not worth a recap. */
const STOP = new Set(RAIZ.filter((r) => ['pron', 'art', 'prep'].includes(r.g)).map((r) => r.es));

/** Saves a word or phrase: it appears in El Jardín as a new seed in "Mis palabras". */
export function saveWord(S: State, es: string, en: string): boolean {
  const key = es.toLowerCase();
  if (S.saved[key]) return false;
  S.saved[key] = { es, en };
  const id = 'w:' + es;
  if (!S.cards[id]) S.cards[id] = { box: 0, due: dayKey(), seen: 0 };
  return true;
}

export interface StoryResult {
  xp: number;
  first: boolean;
  recap: string[];
}

/** Marks a story read: counts it, tracks repeated words, picks up to 5 to keep. */
export function finishStory(S: State, st: Story, rand: () => number = Math.random): StoryResult {
  const n = (S.stories[st.id] as number) || 0;
  S.stories[st.id] = n + 1;
  const seen: Record<string, 1> = {};
  st.s.forEach((s) =>
    s[0].split(' ').forEach((t) => {
      const w = t.replace(/[¿¡"“«(.,;:!?"”»)…]/g, '').toLowerCase();
      if (w && DICT[w] && !seen[w]) {
        seen[w] = 1;
        if (w.length > 3 && !STOP.has(w)) S.expo[w] = (S.expo[w] || 0) + 1;
      }
    }),
  );
  const recap = shuffle(
    Object.keys(seen).filter((w) => w.length > 3 && !STOP.has(w) && !S.saved[w]),
    rand,
  )
    .sort((a, b) => (S.expo[a] || 0) - (S.expo[b] || 0))
    .slice(0, 5);
  const xp = n ? 8 : 25;
  addXP(S, xp, 'read');
  return { xp, first: !n, recap };
}

/** "Ordena la historia": the first 5 sentences, shuffled. */
export function orderPuzzle(st: Story, rand: () => number = Math.random): { sents: string[]; pool: { id: number; t: string }[] } {
  const sents = st.s.slice(0, Math.min(5, st.s.length)).map((s) => s[0]);
  let pool = shuffle(sents.map((t, i) => ({ id: i, t })), rand);
  // never hand out the story already in order
  if (pool.every((p, i) => p.id === i) && pool.length > 1) pool = [...pool.slice(1), pool[0]];
  return { sents, pool };
}

export function orderCheck(S: State, placed: number[]): boolean {
  const ok = placed.every((id, n) => id === n);
  recMod(S, 'orden', ok);
  if (ok) addXP(S, 5, 'read');
  return ok;
}

export const storyById = (id: string) => STORIES.find((s) => s.id === id);
export const timesRead = (S: State, id: string) => (S.stories[id] as number) || 0;
