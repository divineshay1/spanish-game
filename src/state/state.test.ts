import { describe, expect, it } from 'vitest';
import { defaults, mergeState } from './state';
import { makeBackup, readBackup } from './backup';
import { addXP, recWord, curStreak } from './progress';
import { allCards, catalog, seedList, seedsLeftToday } from '../engine/cards';

describe('save format', () => {
  it('defaults: Mexican accent, 5 seeds a day', () => {
    const d = defaults();
    expect(d.accent).toBe('mx');
    expect(d.settings.newPerDay).toBe(5);
  });
  it('fills in missing fields and drops broken cards', () => {
    const s = mergeState({ xp: 40, cards: { c1: { box: 3, due: '2026-11-01', seen: 2 }, bad: 'x', c2: { box: 'nope' } }, settings: { textSize: 1.5 } });
    expect(s.xp).toBe(40);
    expect(Object.keys(s.cards)).toEqual(['c1']);
    expect(s.settings.textSize).toBe(1.5);
    expect(s.settings.newPerDay).toBe(5);
    expect(s.game.coins).toBe(0);
  });
});

describe('backup and restore', () => {
  it('round trips a backup file', () => {
    const s = defaults();
    s.xp = 123;
    s.cards['i:m1'] = { box: 4, due: '2026-12-01', seen: 5 };
    const r = readBackup(JSON.stringify(makeBackup(s)));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('backup');
      expect(r.state.xp).toBe(123);
      expect(r.state.cards['i:m1'].box).toBe(4);
    }
  });
  it('accepts an old Mi Español save', () => {
    const legacy = { name: 'Sha', xp: 50, accent: 'co', cards: { c3: { box: 2, due: '2026-10-01', seen: 4 } }, game: { coins: 7 } };
    const r = readBackup(JSON.stringify(legacy));
    expect(r.ok && r.source).toBe('mi-espanol');
    if (r.ok) {
      expect(r.state.accent).toBe('co');
      expect(r.state.game).toEqual({ coins: 7, cleared: 0, perks: {}, wins: 0, losses: 0, played: 0 });
    }
  });
  it('rejects junk politely', () => {
    expect(readBackup('not json').ok).toBe(false);
    expect(readBackup('{"hello":1}').ok).toBe(false);
    expect(readBackup(JSON.stringify({ app: 'mi-espanol-el-cielo', format: 99, state: {} })).ok).toBe(false);
  });
});

describe('progress', () => {
  it('streak grows on consecutive days', () => {
    const s = defaults();
    s.last = '2000-01-01';
    addXP(s, 10, 'review');
    expect(s.streak).toBe(1);
    expect(s.xp).toBe(10);
    expect(curStreak(s)).toBe(1);
  });
  it('miss list counts down when you get it right', () => {
    const s = defaults();
    recWord(s, 'c1', 'hola', 'hi', false);
    recWord(s, 'c1', 'hola', 'hi', false);
    expect(s.miss.c1.c).toBe(2);
    recWord(s, 'c1', 'hola', 'hi', true);
    recWord(s, 'c1', 'hola', 'hi', true);
    expect(s.miss.c1).toBeUndefined();
  });
});

describe('cards', () => {
  it('accent hides the other country’s phrase cards', () => {
    const mx = defaults();
    const co = { ...defaults(), accent: 'co' as const };
    expect(allCards(mx).some((c) => c.tag === 'Colombia')).toBe(false);
    expect(allCards(co).some((c) => c.tag === 'México')).toBe(false);
  });
  it('catalog has every content family and unique ids', () => {
    const c = catalog(defaults());
    expect(new Set(c.map((x) => x.id)).size).toBe(c.length);
    expect(c.length).toBeGreaterThan(500);
  });
  it('seeds: patient phrases first, 5 per day', () => {
    const s = defaults();
    expect(seedList(s)[0].family).toBe('paciente');
    expect(seedsLeftToday(s)).toBe(5);
  });
});
