/**
 * Grades typed answers: accent aware and typo tolerant. Ported from the prototype.
 *  good   = exactly right
 *  accent = right letters, missing or wrong accent marks (only when accents matter)
 *  close  = one or two typos
 *  bad    = wrong
 */
import { norm } from './text';

export type Grade = 'good' | 'accent' | 'close' | 'bad';

/** Edit distance between two strings. */
export function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p: number[] = [];
  for (let j = 0; j <= n; j++) p[j] = j;
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}

/** All acceptable English answers for a gloss like "to run (fast); to jog". */
export function enAlts(en: string): string[] {
  const base = en.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const short = base.split(' ').length <= 4;
  const parts = short
    ? base
        .split(/[,;/]|\sor\s/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return [...new Set(parts.concat([base]).map((s) => s.replace(/^(to|the|a|an) /i, '').trim()))].filter(Boolean);
}

export function gradeTyped(inp: string, answers: readonly string[], accent: boolean): Grade {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[¿?¡!.,;:"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const x = clean(inp);
  if (!x) return 'bad';
  const xn = norm(inp);
  for (const a of answers) if (clean(a) === x) return 'good';
  for (const a of answers) if (norm(a) === xn) return accent ? 'accent' : 'good';
  for (const a of answers) {
    const y = norm(a);
    const tol = y.length >= 9 ? 2 : y.length >= 5 ? 1 : 0;
    if (tol && lev(xn, y) <= tol) return 'close';
  }
  return 'bad';
}
