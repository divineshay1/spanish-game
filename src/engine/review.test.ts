import { describe, expect, it } from 'vitest';
import { defaults } from '../state/state';
import { answer, checkTyped, finish, prompt, seedQueue, startSession, typedRating, waterQueue } from './review';
import { focusPool, focusResult, focusStep, hint, eqArr } from './focus';
import { cardById } from './cards';
import { rng } from '../art/rng';

const day = new Date(2026, 10, 5, 12);
const key = '2026-11-05';

describe('planting', () => {
  it('offers 5 seeds, planting them counts toward today', () => {
    const S = defaults();
    const seeds = seedQueue(S, key);
    expect(seeds).toHaveLength(5);
    const s = startSession('plant', seeds, 'mc');
    answer(S, s, 'good', day);
    answer(S, s, 'again', day);
    expect(S.cards[seeds[0].id]).toEqual({ box: 1, due: '2026-11-06', seen: 1 });
    expect(S.cards[seeds[1].id]).toEqual({ box: 0, due: key, seen: 1 });
    expect(S.planted[key]).toBe(2);
    expect(seedQueue(S, key)).toHaveLength(3);
    expect(s.grew).toEqual([seeds[0].id]);
  });
  it('planting a picture word marks it as seen', () => {
    const S = defaults();
    const c = cardById(S, 'i:m1')!;
    const s = startSession('plant', [c], 'mc');
    answer(S, s, 'good', day);
    expect(S.imgSeen.m1).toBe(true);
  });
});

describe('watering', () => {
  it('only due plants, weakest first, at most 20', () => {
    const S = defaults();
    for (let i = 1; i <= 30; i++) S.cards['r:r' + i] = { box: i % 4, due: '2026-11-0' + (i % 2 ? 1 : 9), seen: 1 };
    const q = waterQueue(S, rng(1), key);
    expect(q.length).toBe(15); // only the 15 due on the 1st
    expect(q.every((c) => S.cards[c.id].due <= key)).toBe(true);
    const boxes = q.map((c) => S.cards[c.id].box);
    expect([...boxes].sort((a, b) => a - b)).toEqual(boxes);
  });
  it('a miss shrinks the plant and the card comes back at the end', () => {
    const S = defaults();
    S.cards['r:r1'] = { box: 6, due: '2026-11-01', seen: 3 };
    const s = startSession('water', waterQueue(S, rng(2), key), 'flash');
    answer(S, s, 'again', day);
    expect(S.cards['r:r1'].box).toBe(3);
    expect(s.queue).toHaveLength(2);
    answer(S, s, 'good', day);
    expect(S.cards['r:r1'].box).toBe(4);
    finish(S, s);
    expect(S.xp).toBe(2);
    expect(S.miss['r:r1']).toBeUndefined();
  });
  it('multiple choice has 4 different options including the answer', () => {
    const S = defaults();
    const c = cardById(S, 'i:m2')!;
    for (let i = 0; i < 20; i++) {
      const p = prompt(S, c, 'mc', rng(i));
      expect(new Set(p.opts).size).toBe(4);
      expect(p.opts).toContain(p.answer);
    }
  });
  it('typed answers: accents forgiven as "accent", typos as "close"', () => {
    const S = defaults();
    const c = cardById(S, 'i:m1')!; // la casa, house
    expect(checkTyped(c, 'rwd', 'la casa')).toBe('good');
    expect(checkTyped(c, 'rwd', 'casa')).toBe('good');
    expect(checkTyped(c, 'rtr', 'the house')).toBe('good');
    expect(checkTyped(c, 'rtr', 'dog')).toBe('bad');
    expect(typedRating('close')).toBe('good');
    expect(typedRating('bad')).toBe('again');
    expect(typedRating('bad', true)).toBe('good');
  });
});

describe('focus', () => {
  it('rescue list: most missed first, topped up with weakest plants', () => {
    const S = defaults();
    S.cards['r:r1'] = { box: 0, due: key, seen: 1 };
    S.miss['p:p1'] = { es: 'Gracias', en: 'Thank you', c: 3 };
    const pool = focusPool(S);
    expect(pool[0].mk).toBe('p:p1');
    expect(pool.some((x) => x.ck === 'r:r1')).toBe(true);
  });
  it('build steps use syllables for single words and hints place the right chip', () => {
    const S = defaults();
    const st = focusStep(S, { mk: 'i:m4', ck: 'i:m4', es: 'la ventana', en: 'window', c: 1 }, rng(3));
    expect(st.kind).toBe('word');
    expect(st.tokens).toEqual(['ven', 'ta', 'na']);
    let placed: number[] = [];
    for (let i = 0; i < 3; i++) placed = hint(st, placed);
    expect(eqArr(placed.map((id) => st.pool.find((p) => p.id === id)!.w), st.tokens)).toBe(true);
  });
  it('both steps right removes it from the rescue list and grows the plant', () => {
    const S = defaults();
    S.cards['p:p1'] = { box: 2, due: key, seen: 1 };
    S.miss['p:p1'] = { es: 'Gracias', en: 'Thank you', c: 2 };
    const xp = focusResult(S, { mk: 'p:p1', ck: 'p:p1', es: 'Gracias', en: 'Thank you', c: 2 }, true, true, 0);
    expect(S.miss['p:p1']).toBeUndefined();
    expect(S.cards['p:p1'].box).toBe(3);
    expect(xp).toBe(7);
  });
});
