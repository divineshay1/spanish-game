import { describe, expect, it } from 'vitest';
import { pairsFor, gardenPairs, canUseGarden, zap, finishStars } from './estrellas';
import { defaults } from '../state/state';

describe('Estrellas Fugaces', () => {
  it('fixed sets have answers that fit on a star', () => {
    for (const set of ['clinic', 'numbers', 'past'] as const) for (const [, es] of pairsFor(defaults(), set)) expect(es.length).toBeLessThanOrEqual(26);
  });
  it('garden set: needs 6 plants, thirsty first', () => {
    const S = defaults();
    expect(canUseGarden(S)).toBe(false);
    for (let i = 1; i <= 8; i++) S.cards['r:r' + i] = { box: 2, due: i <= 3 ? '2000-01-01' : '2999-01-01', seen: 1 };
    expect(canUseGarden(S)).toBe(true);
    const p = gardenPairs(S, '2026-11-09');
    expect(p.slice(0, 3).every(([, , id]) => S.cards[id!].due === '2000-01-01')).toBe(true);
  });
  it('a right zap waters a thirsty plant once per game', () => {
    const S = defaults();
    S.cards['r:r1'] = { box: 2, due: '2000-01-01', seen: 1 };
    const watered = new Set<string>();
    const pair: [string, string, string] = ['I', 'yo', 'r:r1'];
    expect(zap(S, pair, watered)).toBe(true);
    expect(S.cards['r:r1'].box).toBe(3);
    expect(zap(S, pair, watered)).toBe(false);
    expect(S.cards['r:r1'].box).toBe(3);
    expect(finishStars(S, 4)).toBe(9);
  });
});
