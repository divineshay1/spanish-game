import { describe, expect, it } from 'vitest';
import { MEZCLA, VOCAB, MORE_LESSONS } from '../content/moreLessons';
import { sentence, combos, made } from './mezcla';
import { defaults } from '../state/state';

describe('mezcla', () => {
  it('builds sentences with punctuation and an English gloss', () => {
    const t = MEZCLA.find((x) => x.id === 'm-tome')!;
    expect(sentence(t, [2, 0, 0])).toEqual({ es: '¿Tomó usted el tren anoche?', en: 'Did you take the train last night?' });
    expect(sentence(t, [1, 3, 1])).toEqual({ es: 'No tomé una aspirina esta mañana.', en: "I didn't take an aspirin this morning." });
    expect(combos(MEZCLA[0])).toBe(9 * 3 * 9);
  });
  it('every 5 new sentences = 10 XP, repeats count once', () => {
    const S = defaults();
    const seen = new Set<string>();
    expect(made(S, seen, 'a')).toBe(0);
    expect(made(S, seen, 'a')).toBe(0);
    for (const x of ['b', 'c', 'd']) made(S, seen, x);
    expect(made(S, seen, 'e')).toBe(10);
    expect(S.xp).toBe(10);
  });
  it('content: past-tense lessons use -é / -ó forms, vocabulary has no duplicates', () => {
    const past = MORE_LESSONS.find((l) => l.id === 'b-pasado')!;
    expect(past.items.every(([, es]) => /é|ó/.test(es))).toBe(true);
    expect(new Set(VOCAB.map((v) => v[0])).size).toBe(VOCAB.length);
  });
});
