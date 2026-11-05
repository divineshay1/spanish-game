/** XP, streaks and skill stats (ported from the prototype). */
import { addDays, dayKey } from '../engine/clock';
import type { DayLog, State } from './state';

export function today(S: State, key: string = dayKey()): DayLog {
  if (!S.days[key]) S.days[key] = { xp: 0, done: {} };
  return S.days[key];
}

export const curStreak = (S: State, key: string = dayKey()): number =>
  S.last === key || S.last === addDays(-1) ? S.streak : 0;

export const level = (S: State): number => Math.floor(S.xp / 250) + 1;

/** Adds XP, keeps the streak, ticks off a daily task. */
export function addXP(S: State, n: number, task?: string, key: string = dayKey()): void {
  const t = today(S, key);
  if (S.last !== key) {
    S.streak = S.last === addDays(-1) ? S.streak + 1 : 1;
    S.last = key;
    S.best = Math.max(S.best, S.streak);
  }
  t.xp += n;
  S.xp += n;
  if (task) t.done[task] = true;
}

/** Counts right/wrong per skill for the dashboard. */
export function recMod(S: State, k: string, ok: boolean): void {
  const m = S.mod[k] || (S.mod[k] = { n: 0, r: 0 });
  m.n++;
  if (ok) m.r++;
}

/** Tracks words you keep missing (the rescue list for Focus). */
export function recWord(S: State, key: string, es: string, en: string, ok: boolean): void {
  if (ok) {
    if (S.miss[key]) {
      S.miss[key].c--;
      if (S.miss[key].c <= 0) delete S.miss[key];
    }
  } else {
    const m = S.miss[key] || { es, en, c: 0 };
    m.es = es;
    m.en = en;
    m.c++;
    S.miss[key] = m;
  }
}
