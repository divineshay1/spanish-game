/** Mezcla: build sentences by picking one chunk per column (every combination is correct). */
import type { MezclaTable } from '../content/moreLessons';
import type { State } from '../state/state';
import { addXP, recMod } from '../state/progress';

/** Joins the chosen chunks; closes the question mark when the sentence starts with ¿. */
export function sentence(t: MezclaTable, pick: number[]): { es: string; en: string } {
  const es = pick.map((p, c) => t.cols[c][p][0]).join(' ');
  const en = pick.map((p, c) => t.cols[c][p][1]).join(' ');
  const q = es.startsWith('¿');
  return { es: q ? es + '?' : es + '.', en: q ? en + '?' : en + '.' };
}

export const combos = (t: MezclaTable) => t.cols.reduce((a, c) => a * c.length, 1);

/** Records a new sentence; every 5 different sentences earn 10 XP. */
export function made(S: State, seen: Set<string>, es: string): number {
  if (seen.has(es)) return 0;
  seen.add(es);
  recMod(S, 'mezcla', true);
  if (seen.size % 5 === 0) {
    addXP(S, 10, 'grammar');
    return 10;
  }
  return 0;
}
