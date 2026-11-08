/**
 * La Isla de Inmersión: timed Spanish-only sessions (ported from the
 * prototype's Inmersión total). Activities cycle through: picture, listening,
 * conversation, speaking, dictation, story order and writing.
 */
import { CONN_ES, DLG, HQ, IMG, ISEQ, IST, PHR, STORIES, type Dialogue, type PictureWord } from '../content';
import { shuffle } from './text';
import { gradeTyped, type Grade } from './grading';
import { dayKey } from './clock';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

type R = () => number;
export type Kind = 'img' | 'oye' | 'dial' | 'habla' | 'dicta' | 'orden' | 'escribe';
export const KIND_NAME = IST as Record<Kind, string>;
export const wc = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export interface Line { es: string; en: string }

/** Phrases and dialogue lines between min and max words, no repeats. */
export function lines(min: number, max: number): Line[] {
  const L: Line[] = [];
  PHR.forEach((p) => L.push({ es: p.es, en: p.en }));
  DLG.forEach((d) => d.turns.forEach((t) => L.push({ es: t[1], en: t[2] })));
  const seen = new Set<string>();
  return L.filter((l) => {
    const n = wc(l.es);
    if (n < min || n > max || seen.has(l.es)) return false;
    seen.add(l.es);
    return true;
  });
}

const bsOf = (d: Dialogue) => d.turns.map((t, i) => (t[0] === 'B' ? i : -1)).filter((i) => i >= 0);

export interface Item {
  k: Kind;
  en: string;
  w?: PictureWord;
  wOpts?: PictureWord[];
  line?: Line;
  lOpts?: Line[];
  a?: [string, string, string];
  b?: [string, string, string];
  dOpts?: [string, string, string][];
  title?: string;
  sents?: string[];
  pool?: { id: number; t: string }[];
  q?: [string, string, string];
}

/** The n-th activity of a session (mirrors isPrep()). */
export function makeItem(n: number, r: R = Math.random): Item {
  const k = ISEQ[n % ISEQ.length] as Kind;
  if (k === 'img') {
    const w = shuffle(IMG, r)[0];
    return { k, en: w.en, w, wOpts: shuffle([w, ...shuffle(IMG.filter((x) => x.id !== w.id), r).slice(0, 3)], r) };
  }
  if (k === 'oye') {
    const L = lines(3, 9);
    const l = shuffle(L, r)[0];
    const n0 = wc(l.es);
    return { k, en: l.en, line: l, lOpts: shuffle([l, ...shuffle(L.filter((x) => x.es !== l.es && Math.abs(wc(x.es) - n0) <= 2), r).slice(0, 3)], r) };
  }
  if (k === 'dial') {
    const d = shuffle(DLG, r)[0];
    const j = shuffle(bsOf(d).filter((i) => i >= 1), r)[0];
    const a = d.turns[j - 1];
    const b = d.turns[j];
    const others: [string, string, string][] = [];
    DLG.filter((x) => x.id !== d.id).forEach((x) => bsOf(x).forEach((i) => others.push(x.turns[i])));
    return { k, en: a[2] + ' / ' + b[2], a, b, dOpts: shuffle([b, ...shuffle(others, r).filter((o) => o[1] !== b[1]).slice(0, 2)], r) };
  }
  if (k === 'dicta') {
    const l = shuffle(lines(3, 8), r)[0];
    return { k, en: l.en, line: l };
  }
  if (k === 'orden') {
    const st = shuffle(STORIES, r)[0];
    const sents = st.s.slice(0, Math.min(5, st.s.length)).map((s) => s[0]);
    let pool = shuffle(sents.map((t, i) => ({ id: i, t })), r);
    if (pool.every((p, i) => p.id === i)) pool = [...pool.slice(1), pool[0]];
    return { k, en: '', title: st.title, sents, pool };
  }
  const q = shuffle(HQ, r)[0];
  return { k, en: q[2], q };
}

/** What the activity says out loud first. */
export function audioOf(it: Item): string {
  if (it.k === 'oye' || it.k === 'dicta') return it.line!.es;
  if (it.k === 'dial') return it.a![1];
  if (it.k === 'habla' || it.k === 'escribe') return it.q![0];
  if (it.k === 'img') return it.w!.es;
  return '';
}

export function pickOk(it: Item, i: number): boolean {
  if (it.k === 'img') return it.wOpts![i].id === it.w!.id;
  if (it.k === 'oye') return it.lOpts![i].es === it.line!.es;
  return it.dOpts![i][1] === it.b![1];
}

export const dictation = (it: Item, typed: string): Grade => gradeTyped(typed, [it.line!.es], true);

/** Writing: word count and the connectors used (porque, pero, también…). 8+ words counts as right. */
export function writing(typed: string): { words: number; conn: string[]; ok: boolean } {
  const low = ' ' + typed.toLowerCase().replace(/[.,;:!?¿¡]/g, ' ') + ' ';
  const conn = CONN_ES.filter((w) => low.indexOf(' ' + w + ' ') >= 0);
  const words = wc(typed);
  return { words, conn, ok: words >= 8 };
}

/** Speaking: 6+ words heard counts as right. */
export const speakingOk = (heard: string): boolean => wc(heard) >= 6;

export interface ImmSession {
  mins: number;
  n: number;
  right: number;
  total: number;
  helpN: number;
  t0: number;
  endAt: number;
}

export const newSession = (mins: number, now = Date.now()): ImmSession => ({ mins, n: 0, right: 0, total: 0, helpN: 0, t0: now, endAt: now + mins * 60000 });

export function score(S: State, s: ImmSession, ok: boolean): void {
  s.total++;
  if (ok) s.right++;
  recMod(S, 'imm', ok);
}

/** Ends the session: minutes (capped at the chosen length + 2), XP, and lifetime stats. */
export function finishSession(S: State, s: ImmSession, now = Date.now()): { min: number; right: number; total: number; help: number; xp: number } {
  const el = Math.max(1, Math.round((now - s.t0) / 60000));
  const min = Math.min(s.mins + 2, el);
  const xp = s.right * 3 + min * 2 + 10;
  const d = S.immData;
  d.min += min;
  d.sess++;
  d.help += s.helpN;
  d.right += s.right;
  d.total += s.total;
  const k = dayKey();
  d.days[k] = ((d.days[k] as number) || 0) + min;
  addXP(S, xp, 'inmersion');
  return { min, right: s.right, total: s.total, help: s.helpN, xp };
}
