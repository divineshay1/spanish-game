import { describe, expect, it } from 'vitest';
import { tokens, gloss, saveWord, finishStory, orderPuzzle, orderCheck } from './reading';
import { STORIES } from '../content';
import { defaults } from '../state/state';
import { catalog, allCards } from './cards';
import { rng } from '../art/rng';

describe('reading', () => {
  it('splits words from punctuation', () => {
    expect(tokens('¿Cómo está, señora?')).toEqual([
      { pre: '¿', word: 'Cómo', post: '' },
      { pre: '', word: 'está', post: ',' },
      { pre: '', word: 'señora', post: '?' },
    ]);
  });
  it('every story sentence rebuilds exactly from its tokens', () => {
    for (const st of STORIES) for (const [es] of st.s) expect(tokens(es).map((t) => t.pre + t.word + t.post).join(' ')).toBe(es);
  });
  it('glosses come from the prototype dictionary, case-insensitive', () => {
    expect(gloss('Me')).toBe('me / myself (me llamo = my name is)');
    expect(gloss('zzzz')).toBeUndefined();
  });
  it('saving a word plants a seed in Mis palabras', () => {
    const S = defaults();
    expect(saveWord(S, 'mañana', 'morning')).toBe(true);
    expect(saveWord(S, 'mañana', 'morning')).toBe(false);
    expect(S.cards['w:mañana'].box).toBe(0);
    expect(catalog(S).find((c) => c.id === 'w:mañana')!.family).toBe('mias');
    expect(allCards(S).some((c) => c.id === 'w:mañana')).toBe(true);
  });
  it('finishing a story: 25 XP the first time, 8 after, up to 5 recap words', () => {
    const S = defaults();
    const a = finishStory(S, STORIES[0], rng(1));
    expect(a.xp).toBe(25);
    expect(a.recap.length).toBeLessThanOrEqual(5);
    expect(a.recap.every((w) => w.length > 3)).toBe(true);
    expect(finishStory(S, STORIES[0], rng(2)).xp).toBe(8);
    expect(S.stories[STORIES[0].id]).toBe(2);
    expect(Object.keys(S.expo).length).toBeGreaterThan(0);
    expect(S.days[Object.keys(S.days)[0]].done.read).toBe(true);
  });
  it('order puzzle: 5 sentences, never already solved, checked in order', () => {
    for (let i = 0; i < 20; i++) {
      const p = orderPuzzle(STORIES[1], rng(i));
      expect(p.sents).toHaveLength(5);
      expect(p.pool.every((x, n) => x.id === n)).toBe(false);
    }
    const S = defaults();
    expect(orderCheck(S, [0, 1, 2, 3, 4])).toBe(true);
    expect(orderCheck(S, [1, 0, 2, 3, 4])).toBe(false);
    expect(S.mod.orden).toEqual({ n: 2, r: 1 });
  });
});
