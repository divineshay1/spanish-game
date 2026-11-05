import { describe, expect, it } from 'vitest';
import { rate, gapDays, thirst, isDue, lapse, MAXBOX } from './srs';
import { dayKey, addDays, daysBetween } from './clock';

const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

describe('rate()', () => {
  it('a new card answered right goes to box 1, due tomorrow', () => {
    const c = rate(undefined, 'good', day('2026-11-05'));
    expect(c).toEqual({ box: 1, due: '2026-11-06', seen: 1 });
  });
  it('easy jumps two boxes', () => {
    expect(rate({ box: 2, due: '', seen: 3 }, 'easy', day('2026-11-05')).box).toBe(4);
  });
  it('a miss steps back and is due again today', () => {
    expect(rate({ box: 6, due: '2026-11-01', seen: 9 }, 'again', day('2026-11-05'))).toEqual({ box: 3, due: '2026-11-05', seen: 10 });
    expect(rate({ box: 3, due: '', seen: 1 }, 'again', day('2026-11-05')).box).toBe(2);
    expect(rate({ box: 1, due: '', seen: 1 }, 'again', day('2026-11-05')).box).toBe(0);
  });
  it('never goes above the top box', () => {
    expect(rate({ box: 8, due: '', seen: 1 }, 'easy', day('2026-11-05')).box).toBe(MAXBOX);
  });
  it('gaps follow [0,1,2,4,8,16,35,70,140] with about 10% wiggle from 16 days', () => {
    expect([0, 1, 2, 3, 4].map((b) => gapDays(b, () => 0.5))).toEqual([0, 1, 2, 4, 8]);
    expect(gapDays(5, () => 0)).toBe(Math.round(16 * 0.9));
    expect(gapDays(5, () => 0.999)).toBe(Math.round(16 * 1.0998));
    for (let i = 0; i < 200; i++) {
      const g = gapDays(8);
      expect(g).toBeGreaterThanOrEqual(126);
      expect(g).toBeLessThanOrEqual(154);
    }
  });
  it('lapse rule', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(lapse)).toEqual([0, 0, 1, 2, 3, 2, 3, 3, 4]);
  });
});

describe('wilting', () => {
  it('fine before due, droops when due, fades when very late', () => {
    const c = { box: 3, due: '2026-11-10', seen: 2 }; // gap 4 days
    expect(thirst(c, '2026-11-09')).toBe(0);
    expect(thirst(c, '2026-11-10')).toBe(1);
    expect(thirst(c, '2026-11-14')).toBe(1);
    expect(thirst(c, '2026-11-15')).toBe(2);
    expect(isDue(c, '2026-11-10')).toBe(true);
  });
});

describe('clock helpers', () => {
  it('day keys and differences', () => {
    expect(dayKey(day('2026-01-09'))).toBe('2026-01-09');
    expect(addDays(1, day('2026-12-31'))).toBe('2027-01-01');
    expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30);
  });
});
