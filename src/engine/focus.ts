/**
 * Focus: a rescue round for the words you keep missing (ported from the prototype).
 * Step 1: recognise it (multiple choice). Step 2: build it from syllables or words.
 * Both right = it leaves the rescue list.
 */
import { EXTRA, IMG, PHR, VERBS } from '../content';
import { allCards } from './cards';
import { dueIn, lapse, MAXBOX } from './srs';
import { dayKey } from './clock';
import { syllabify } from './pronunciation';
import { cleanEs, norm, shuffle } from './text';
import type { State } from '../state/state';
import { recMod, recWord } from '../state/progress';

export interface FocusItem {
  /** key in the miss list */
  mk: string;
  /** card id */
  ck: string;
  es: string;
  en: string;
  c: number;
}

export interface Chip {
  w: string;
  id: number;
}

export interface FocusStep {
  opts: string[];
  kind: 'word' | 'phrase';
  art: string;
  core: string;
  tokens: string[];
  pool: Chip[];
}

/** Up to 8 most-missed words, topped up with the weakest planted cards. */
export function focusPool(S: State): FocusItem[] {
  let list: FocusItem[] = Object.entries(S.miss)
    .map(([k, m]) => ({ mk: k, ck: k.replace(/^c:/, ''), es: cleanEs(m.es), en: m.en, c: m.c }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 8);
  if (list.length < 5) {
    const have = new Set(list.map((x) => x.ck));
    const weak = allCards(S)
      .filter((c) => S.cards[c.id] && !have.has(c.id))
      .sort((a, b) => S.cards[a.id].box - S.cards[b.id].box)
      .slice(0, 8 - list.length)
      .map((c) => ({ mk: c.id, ck: c.id, es: cleanEs(c.es), en: c.en, c: 0 }));
    list = list.concat(weak);
  }
  return list;
}

let SYLS: string[] | null = null;
function sylPool(): string[] {
  if (!SYLS) {
    const s = new Set<string>();
    [...IMG, ...VERBS].forEach((x) => syllabify(x.es.toLowerCase()).forEach((y) => s.add(y)));
    SYLS = [...s];
  }
  return SYLS;
}

const mkChips = (tokens: string[], extra: string[], rand: () => number): Chip[] =>
  shuffle(tokens.concat(extra), rand).map((w, i) => ({ w, id: i }));

/** Builds the two steps for one word (mirrors foPrep()). */
export function focusStep(S: State, it: FocusItem, rand: () => number = Math.random): FocusStep {
  const allEn = [...new Set(IMG.map((x) => x.en).concat(PHR.map((p) => p.en)).concat(Object.values(S.miss).map((m) => m.en)))].filter(
    (e) => e !== it.en,
  );
  const opts = shuffle([it.en, ...shuffle(allEn, rand).slice(0, 3)], rand);
  const m = it.es.match(/^(el|la|los|las) (.+)$/);
  const core = m ? m[2] : it.es;
  const art = m ? m[1] : '';
  if (core.indexOf(' ') < 0 && core.length >= 3 && !/[¿?¡!,.]/.test(core)) {
    const lw = core.toLowerCase();
    let syl = syllabify(lw);
    let letters = false;
    if (syl.length < 2) {
      syl = lw.split('');
      letters = true;
    }
    const ex = letters
      ? shuffle('aeoiunrsltm'.split('').filter((c) => !syl.includes(c)), rand).slice(0, 2)
      : shuffle(sylPool().filter((s) => !syl.includes(s) && s.length <= 4), rand).slice(0, 3);
    return { opts, kind: 'word', art, core: lw, tokens: syl, pool: mkChips(syl, ex, rand) };
  }
  const tokens = it.es.split(' ');
  const ex = shuffle(
    EXTRA.filter((w) => !norm(it.es).split(' ').includes(norm(w))),
    rand,
  ).slice(0, 2);
  return { opts, kind: 'phrase', art, core: it.es, tokens, pool: mkChips(tokens, ex, rand) };
}

export const eqArr = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

/** Next chip a hint should place (resets a wrong start). Returns the new placed list. */
export function hint(step: FocusStep, placed: number[]): number[] {
  const cur = placed.map((id) => step.pool.find((p) => p.id === id)!.w);
  let out = eqArr(cur, step.tokens.slice(0, cur.length)) ? placed.slice() : [];
  const n = out.length;
  if (n >= step.tokens.length) return out;
  const c = step.pool.find((p) => p.w === step.tokens[n] && !out.includes(p.id));
  if (c) out = [...out, c.id];
  return out;
}

/** Records the result of one Focus word. Returns XP earned. */
export function focusResult(S: State, it: FocusItem, mcOk: boolean, buildOk: boolean, hints: number): number {
  recMod(S, 'focus', buildOk);
  if (buildOk && mcOk) delete S.miss[it.mk];
  else recWord(S, it.mk, it.es, it.en, buildOk);
  const st = S.cards[it.ck] ? { ...S.cards[it.ck] } : { box: 0, due: '', seen: 0 };
  st.seen++;
  let xp = mcOk ? 2 : 0;
  if (buildOk) {
    st.box = Math.min(MAXBOX, st.box + 1);
    st.due = dueIn(st.box);
    xp += Math.max(2, 5 - hints);
  } else {
    st.box = lapse(st.box);
    st.due = dayKey();
  }
  S.cards[it.ck] = st;
  recMod(S, 'focus', mcOk);
  return xp;
}
