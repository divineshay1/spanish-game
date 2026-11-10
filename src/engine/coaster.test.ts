import { describe, expect, it } from 'vitest';
import { rideWords, choices, rideRight, finishRide, RIDE_LEN } from './coaster';
import { defaults } from '../state/state';

describe('La Montaña Rusa', () => {
  it('always has ten words, starter words when the garden is empty', () => {
    const w = rideWords(defaults());
    expect(w).toHaveLength(RIDE_LEN);
    expect(new Set(w.map((x) => x[1])).size).toBe(RIDE_LEN);
  });
  it('uses your plants first, thirsty ones at the front', () => {
    const S = defaults();
    for (let i = 1; i <= 4; i++) S.cards['r:r' + i] = { box: 2, due: i <= 2 ? '2000-01-01' : '2999-01-01', seen: 1 };
    const w = rideWords(S, '2026-11-10');
    expect(w).toHaveLength(RIDE_LEN);
    expect(w.slice(0, 2).every((x) => x[2] && S.cards[x[2]].due === '2000-01-01')).toBe(true);
    expect(w.slice(2, 4).every((x) => !!x[2])).toBe(true);
  });
  it('four distinct choices including the answer', () => {
    const S = defaults();
    const ride = rideWords(S);
    const c = choices(S, ride[0], ride);
    expect(c).toHaveLength(4);
    expect(new Set(c).size).toBe(4);
    expect(c).toContain(ride[0][1]);
  });
  it('a right answer waters a thirsty plant once per ride', () => {
    const S = defaults();
    S.cards['r:r1'] = { box: 2, due: '2000-01-01', seen: 1 };
    const watered = new Set<string>();
    expect(rideRight(S, ['yo', 'I', 'r:r1'], watered)).toBe(true);
    expect(S.cards['r:r1'].box).toBe(3);
    expect(rideRight(S, ['yo', 'I', 'r:r1'], watered)).toBe(false);
    expect(finishRide(S, 10, true)).toBe(15);
  });
});
