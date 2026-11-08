/**
 * El Barrio: walk the street and talk to people. Each place holds some of the
 * prototype's dialogues; you reply by choosing or building each line.
 */
import { DLG, EXTRA, type Dialogue } from '../content';
import { norm, shuffle } from './text';
import { eqArr, type Chip } from './grammar';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

type R = () => number;

export interface Place { id: string; name: string; who: string; wall: string; dlgs: string[] }

export const PLACES: Place[] = [
  { id: 'casa', name: 'Casa de Ana', who: 'Ana', wall: '#fbd3b5', dlgs: ['d1', 'd2', 'd7', 'd12'] },
  { id: 'cafeteria', name: 'Cafetería', who: 'Luis', wall: '#f6e4f8', dlgs: ['d3'] },
  { id: 'farmacia', name: 'Farmacia', who: 'Rosa', wall: '#a6dcb4', dlgs: ['d5'] },
  { id: 'restaurante', name: 'Restaurante', who: 'Jorge', wall: '#fcb4db', dlgs: ['d6'] },
  { id: 'taxi', name: 'Parada de taxis', who: 'Pedro', wall: '#ffe066', dlgs: ['d8'] },
  { id: 'plaza', name: 'La plaza', who: 'Sofía', wall: '#d9c6f7', dlgs: ['d4', 'd13', 'd14'] },
  { id: 'consultorio', name: 'Consultorio', who: 'Carmen', wall: '#c3e6ff', dlgs: ['d9', 'd10', 'd11'] },
];

export const dlgById = (id: string) => DLG.find((d) => d.id === id)!;
/** Indexes of your (B) lines. */
export const myTurns = (d: Dialogue) => d.turns.map((t, i) => (t[0] === 'B' ? i : -1)).filter((i) => i >= 0);

export interface Turn {
  j: number;
  /** the other person's line before yours, if any */
  a: [string, string, string] | null;
  b: [string, string, string];
  tokens: string[];
  pool: Chip[];
  /** for "choose" mode: your line and two lines from other conversations */
  opts: string[];
}

export function makeTurn(d: Dialogue, k: number, r: R = Math.random): Turn {
  const j = myTurns(d)[k];
  const a = d.turns[j - 1] && d.turns[j - 1][0] === 'A' ? d.turns[j - 1] : null;
  const b = d.turns[j];
  const tokens = b[1].split(' ');
  const ex = shuffle(EXTRA.filter((w) => !norm(b[1]).split(' ').includes(norm(w))), r).slice(0, 2);
  const pool = shuffle(tokens.concat(ex), r).map((w, i) => ({ w, id: i }));
  const others: string[] = [];
  DLG.filter((x) => x.id !== d.id).forEach((x) => myTurns(x).forEach((i) => others.push(x.turns[i][1])));
  const opts = shuffle([b[1], ...shuffle(others, r).filter((o) => o !== b[1]).slice(0, 2)], r);
  return { j, a, b, tokens, pool, opts };
}

export const buildOk = (t: Turn, placed: number[]) => eqArr(placed.map((id) => t.pool.find((p) => p.id === id)!.w), t.tokens);

export function hint(t: Turn, placed: number[]): number[] {
  const cur = placed.map((id) => t.pool.find((p) => p.id === id)!.w);
  let out = eqArr(cur, t.tokens.slice(0, cur.length)) ? placed.slice() : [];
  const chip = t.pool.find((p) => p.w === t.tokens[out.length] && !out.includes(p.id));
  if (chip && out.length < t.tokens.length) out = [...out, chip.id];
  return out;
}

/** XP for one reply, as in the prototype (2 to 6, fewer hints = more). Choosing is worth 2. */
export function scoreTurn(S: State, ok: boolean, mode: 'build' | 'choose', hints: number): number {
  recMod(S, 'talk', ok);
  if (!ok) return 0;
  return mode === 'build' ? Math.max(2, 6 - hints) : 2;
}

export function finishTalk(S: State, d: Dialogue, xp: number): number {
  S.barrio = S.barrio || { talks: {} };
  S.barrio.talks[d.id] = (S.barrio.talks[d.id] || 0) + 1;
  const total = xp + 5;
  addXP(S, total, 'talk');
  return total;
}

export const placeDone = (S: State, p: Place) => p.dlgs.every((id) => (S.barrio?.talks[id] || 0) > 0);
