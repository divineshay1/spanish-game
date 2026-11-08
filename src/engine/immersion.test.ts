import { describe, expect, it } from 'vitest';
import { makeItem, lines, pickOk, dictation, writing, speakingOk, newSession, score, finishSession, audioOf, wc } from './immersion';
import { ISEQ } from '../content';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('inmersión', () => {
  it('cycles through the prototype order of activities', () => {
    expect(ISEQ).toEqual(['img', 'oye', 'dial', 'habla', 'dicta', 'img', 'oye', 'orden', 'escribe', 'dial']);
    for (let n = 0; n < 20; n++) expect(makeItem(n, rng(n)).k).toBe(ISEQ[n % ISEQ.length]);
  });
  it('choice activities have exactly one right answer', () => {
    for (let s = 0; s < 40; s++)
      for (const n of [0, 1, 2]) {
        const it = makeItem(n, rng(s * 3 + n));
        const count = (it.wOpts || it.lOpts || it.dOpts)!.length;
        const right = [...Array(count).keys()].filter((i) => pickOk(it, i));
        expect(right).toHaveLength(1);
        expect(audioOf(it)).toBeTruthy();
      }
  });
  it('listening lines are 3 to 9 words', () => {
    expect(lines(3, 9).every((l) => wc(l.es) >= 3 && wc(l.es) <= 9)).toBe(true);
  });
  it('dictation forgives accents (as "accent") and small typos', () => {
    const it = makeItem(4, rng(1));
    expect(dictation(it, it.line!.es)).toBe('good');
    expect(dictation(it, 'zzz')).toBe('bad');
  });
  it('writing counts words and connectors', () => {
    const w = writing('Me siento cansada porque trabajé mucho, pero estoy feliz.');
    expect(w.words).toBe(9);
    expect(w.conn).toEqual(['porque', 'pero']);
    expect(w.ok).toBe(true);
    expect(writing('Hola').ok).toBe(false);
    expect(speakingOk('me llamo Ana y soy enfermera')).toBe(true);
  });
  it('finishing: XP = right×3 + minutes×2 + 10, minutes capped', () => {
    const S = defaults();
    const s = newSession(10, 0);
    score(S, s, true);
    score(S, s, true);
    score(S, s, false);
    s.helpN = 1;
    const r = finishSession(S, s, 30 * 60000);
    expect(r.min).toBe(12);
    expect(r.xp).toBe(2 * 3 + 12 * 2 + 10);
    expect(S.immData).toMatchObject({ min: 12, sess: 1, help: 1, right: 2, total: 3 });
  });
});
