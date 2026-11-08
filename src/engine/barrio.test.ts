import { describe, expect, it } from 'vitest';
import { PLACES, dlgById, myTurns, makeTurn, buildOk, hint, scoreTurn, finishTalk, placeDone } from './barrio';
import { DLG } from '../content';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('El Barrio', () => {
  it('every dialogue lives in exactly one place', () => {
    const ids = PLACES.flatMap((p) => p.dlgs);
    expect(ids.sort()).toEqual(DLG.map((d) => d.id).sort());
  });
  it('turns: your line, the other person before it, 3 different choices', () => {
    for (const d of DLG)
      myTurns(d).forEach((_, k) => {
        const t = makeTurn(d, k, rng(k));
        expect(t.b[0]).toBe('B');
        expect(t.opts).toContain(t.b[1]);
        expect(new Set(t.opts).size).toBe(3);
        expect(t.pool.map((p) => p.w)).toEqual(expect.arrayContaining(t.tokens));
      });
  });
  it('hints build the right reply; scoring and finishing', () => {
    const S = defaults();
    const d = dlgById('d9');
    const t = makeTurn(d, 0, rng(2));
    let placed: number[] = [];
    for (let i = 0; i < t.tokens.length; i++) placed = hint(t, placed);
    expect(buildOk(t, placed)).toBe(true);
    expect(scoreTurn(S, true, 'build', 0)).toBe(6);
    expect(scoreTurn(S, true, 'choose', 0)).toBe(2);
    expect(scoreTurn(S, false, 'build', 0)).toBe(0);
    expect(finishTalk(S, d, 10)).toBe(15);
    expect(S.barrio.talks.d9).toBe(1);
    expect(placeDone(S, PLACES.find((p) => p.id === 'consultorio')!)).toBe(false);
  });
});
