/**
 * Proves the TypeScript engines give the same answers as the prototype.
 * Golden files come from running mi-espanol-legacy.html's own code
 * (scripts/extract_legacy.mjs).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pron, syllabify } from './pronunciation';
import { conj, forms, subjForms, impForms, conjNotes, type TenseId } from './conjugation';
import { n2s } from './numbers';
import { enAlts, gradeTyped } from './grading';
import { INT, lapse } from './srs';

const gold = (f: string) => JSON.parse(readFileSync(new URL(`../../tests/golden/${f}`, import.meta.url), 'utf8'));

describe('pronunciation matches the prototype', () => {
  const g = gold('pron.json') as Record<string, { syl: string[]; st: number; say: string; sy: string[] }>;
  it(`all ${Object.keys(g).length} words`, () => {
    const bad: string[] = [];
    for (const [w, want] of Object.entries(g)) {
      const got = pron(w);
      if (JSON.stringify([got.syl, got.st, got.say, syllabify(w)]) !== JSON.stringify([want.syl, want.st, want.say, want.sy]))
        bad.push(`${w}: ${got.say} vs ${want.say}`);
    }
    expect(bad).toEqual([]);
  });
  it('no longer hangs on words with y between a vowel and a consonant', () => {
    for (const w of ['days', 'always', 'sundays', 'keys']) expect(pron(w).say.length).toBeGreaterThan(0);
  });
});

describe('conjugation matches the prototype', () => {
  const g = gold('conj.json') as Record<string, any>;
  it(`all ${Object.keys(g).length} verbs, every tense, subjunctive and commands`, () => {
    for (const [inf, want] of Object.entries(g)) {
      const cj = conj(inf);
      expect({ inf, pr: cj.pr, pt: cj.pt, im: cj.im, part: cj.part, ger: cj.ger, refl: cj.refl }).toEqual({
        inf, pr: want.pr, pt: want.pt, im: want.im, part: want.part, ger: want.ger, refl: want.refl,
      });
      for (const [tid, f] of Object.entries(want.tenses)) expect([inf, tid, forms(cj, tid as TenseId)]).toEqual([inf, tid, f]);
      expect(subjForms(cj)).toEqual(want.subj);
      expect(impForms(cj)).toEqual(want.imp);
      expect(conjNotes(inf)).toEqual(want.notes);
    }
  });
  it('spot checks a nurse would use', () => {
    expect(forms(conj('tener'), 'pres')).toEqual(['tengo', 'tienes', 'tiene', 'tenemos', 'tienen']);
    expect(forms(conj('sentirse'), 'pres')[2]).toBe('se siente');
    expect(impForms(conj('abrir'))!.find((c) => c.lab === 'usted')!.f).toBe('abra');
  });
});

describe('number-to-Spanish matches the prototype', () => {
  const g = gold('n2s.json') as Record<string, string>;
  it(`${Object.keys(g).length} numbers`, () => {
    for (const [n, want] of Object.entries(g)) expect([n, n2s(Number(n))]).toEqual([n, want]);
  });
  it('vitals read correctly', () => {
    expect(n2s(120)).toBe('ciento veinte');
    expect(n2s(80)).toBe('ochenta');
    expect(n2s(100)).toBe('cien');
    expect(n2s(1998)).toBe('mil novecientos noventa y ocho');
  });
});

describe('grading matches the prototype', () => {
  const g = gold('grade.json') as {
    cases: { inp: string; answers: string[]; accent: boolean; res: string }[];
    enAlts: Record<string, string[]>;
  };
  it(`${g.cases.length} typed answers`, () => {
    for (const c of g.cases) expect([c.inp, c.answers, c.accent, gradeTyped(c.inp, c.answers, c.accent)]).toEqual([c.inp, c.answers, c.accent, c.res]);
  });
  it(`${Object.keys(g.enAlts).length} English answer lists`, () => {
    for (const [en, want] of Object.entries(g.enAlts)) expect([en, enAlts(en)]).toEqual([en, want]);
  });
  it('accent, typo and override behaviour', () => {
    expect(gradeTyped('corazón', ['el corazón', 'corazón'], true)).toBe('good');
    expect(gradeTyped('corazon', ['corazón'], true)).toBe('accent');
    expect(gradeTyped('corazon', ['corazón'], false)).toBe('good');
    expect(gradeTyped('corazóm', ['corazón'], true)).toBe('close');
    expect(gradeTyped('perro', ['gato'], true)).toBe('bad');
  });
});

describe('spaced repetition constants match the prototype', () => {
  const g = gold('srs.json');
  it('intervals and lapses', () => {
    expect([...INT]).toEqual(g.INT);
    expect(INT.map((_, b) => lapse(b))).toEqual(g.lapse);
  });
});
