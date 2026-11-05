/**
 * The game's idea of "now". A day offset lets us test wilting
 * without waiting (the hidden time-travel switch).
 */
let offsetDays = 0;

export const setDayOffset = (n: number): void => {
  offsetDays = n;
};
export const getDayOffset = (): number => offsetDays;

export function now(): Date {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return d;
}

/** Local calendar day as "YYYY-MM-DD" (same format as the prototype). */
export const dayKey = (d: Date = now()): string =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export function addDays(n: number, from: Date = now()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days from key a to key b (b - a). */
export function daysBetween(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86400000);
}
