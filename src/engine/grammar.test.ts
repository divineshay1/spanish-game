import { describe, expect, it } from 'vitest';
import { buildQuiz, answerQuiz, quizSkill, buildItems, checkBuild, buildHint, verbItem, genVerbItems, finoItems, answerFino, type QuizKind } from './grammar';
import { DIFS, PCATS, RGRP, TOPICS } from '../content';
import { defaults } from '../state/state';
import { rng } from '../art/rng';

describe('grammar drills', () => {
  const kinds: [QuizKind, object][] = [
    ['q', {}], ['tp', {}], ['ta', {}], ['comp', {}], ['c', {}], ['v', { vg: 0 }], ['v', { vg: 4 }],
    ...PCATS.map((c) => ['ph', { cat: c.id }] as [QuizKind, object]),
    ...RGRP.map((_, i) => ['rt', { rg: i }] as [QuizKind, object]),
    ['dif', { difq: 'all' }], ...DIFS.map((g) => ['dif', { difq: g.id }] as [QuizKind, object]),
    ...TOPICS.map((t) => ['topic', { topic: t.id }] as [QuizKind, object]),
  ];
  it('every drill: answers are among unique options', () => {
    for (const [k, o] of kinds)
      for (let s = 0; s < 5; s++) {
        const q = buildQuiz(k, o, rng(s));
        expect(q.items.length).toBeGreaterThan(0);
        for (const it of q.items) {
          expect(it.opts).toContain(it.a);
          expect(new Set(it.opts).size).toBe(it.opts.length);
        }
      }
  });
  it('question words read back with the answer filled in', () => {
    const q = buildQuiz('q', {}, rng(1));
    for (const it of q.items) expect(it.say).not.toContain('___');
  });
  it('verb answers grow the verb plant', () => {
    const S = defaults();
    const it = buildQuiz('v', { vg: 0 }, rng(2)).items[0];
    expect(answerQuiz(S, quizSkill('v'), it, true)).toBe(3);
    expect(S.cards[it.ck!].box).toBe(1);
    expect(S.mod.g_v).toEqual({ n: 1, r: 1 });
    expect(quizSkill('topic', { topic: 'ser' })).toBe('g_ser');
  });
});

describe('Armar', () => {
  it('verb builds: pieces join into the real form', () => {
    const it = verbItem({ es: 'hablar' }, 'pres', 0, rng(1))!;
    expect(it.ans).toEqual(['habl', 'o']);
    const perf = verbItem({ es: 'comer' }, 'perf', 2, rng(1))!;
    expect(perf.ans).toEqual(['ha', 'comido']);
    const fut = verbItem({ es: 'tener' }, 'fut', 0, rng(1))!;
    expect(fut.ans).toEqual(['tendr', 'é']);
    for (const b of genVerbItems(null, rng(3))) expect(b.pool.map((p) => p.w)).toEqual(expect.arrayContaining(b.ans));
  });
  it('every kind builds, hints solve, and checking records skills', () => {
    const S = defaults();
    for (const kind of ['frase', 'oido', 'palabra', 'verbo'] as const) {
      const items = buildItems(S, kind, 0, rng(4));
      expect(items.length).toBe(8);
      const it = items[0];
      let placed: number[] = [];
      for (let i = 0; i < it.ans.length; i++) placed = buildHint(it, placed);
      expect(checkBuild(S, it, placed, it.ans.length)).toEqual({ ok: true, xp: 2 });
    }
    expect(Object.keys(S.mod).sort()).toEqual(['bld', 'ear', 'vrb', 'wrd']);
  });
  it('sentence levels filter', () => {
    for (const it of buildItems(defaults(), 'frase', 1, rng(5))) expect(it.ans.length).toBeGreaterThan(0);
  });
});

describe('Oído fino', () => {
  it('10 minimal pairs, right answer is the one played', () => {
    const S = defaults();
    const items = finoItems(rng(6));
    expect(items).toHaveLength(10);
    expect(answerFino(S, items[0], items[0].t)).toBe(true);
    expect(answerFino(S, items[0], 1 - items[0].t)).toBe(false);
  });
});
